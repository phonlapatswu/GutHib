import { Request, Response } from 'express';
import prisma from '../db';
import { getIO } from '../socket';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = (req as any).user.user_id;
    const { recipient_id, project_id } = req.query;

    const where: any = {};
    if (project_id) {
      where.project_id = parseInt(project_id as string, 10);
    } else if (recipient_id) {
      const otherId = parseInt(recipient_id as string, 10);
      where.OR = [
        { sender_id: currentUserId, recipient_id: otherId },
        { sender_id: otherId, recipient_id: currentUserId }
      ];
    } else {
      // If none provided, return nothing or maybe public messages?
      // User said "Take global chat away", so we only return if scoped.
      res.json([]);
      return;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        sender: { select: { user_id: true, username: true, avatar_url: true } },
        recipient: { select: { user_id: true, username: true, avatar_url: true } }
      }
    });

    // Optionally mark as read automatically when fetching? 
    // Usually better to have an explicit markAsRead call, but we can do it here too.

    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, recipient_id, recipient_email, project_id } = req.body;
    const senderId = (req as any).user.user_id;

    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    let resolvedRecipientId = recipient_id ? parseInt(recipient_id, 10) : null;
    let resolvedProjectId = project_id ? parseInt(project_id, 10) : null;

    // Direct message logic via email
    if (!resolvedRecipientId && !resolvedProjectId && recipient_email) {
      const user = await prisma.user.findUnique({ where: { email: recipient_email } });
      if (!user) {
        res.status(404).json({ error: 'User with this email not found' });
        return;
      }
      resolvedRecipientId = user.user_id;
    }

    const newMessage = await prisma.message.create({
      data: {
        text,
        sender_id: senderId,
        recipient_id: resolvedRecipientId,
        project_id: resolvedProjectId
      },
      include: {
        sender: { select: { username: true, avatar_url: true } },
        recipient: { select: { username: true, avatar_url: true } }
      }
    });

    const io = getIO();
    if (resolvedRecipientId) {
      io.to(`user_${resolvedRecipientId}`).emit('new_message', newMessage);
      io.to(`user_${resolvedRecipientId}`).emit('unread_count_update');
    } else if (resolvedProjectId) {
      io.to(`project_${resolvedProjectId}`).emit('new_message', newMessage);
      // Project members unread count will be updated when they get the new message signal
      io.to(`project_${resolvedProjectId}`).emit('unread_count_update');
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    // Find all unique users I have chatted with
    const sent = await prisma.message.findMany({
      where: { sender_id: userId, recipient_id: { not: null } },
      select: { recipient_id: true }
    });
    const received = await prisma.message.findMany({
      where: { recipient_id: userId },
      select: { sender_id: true }
    });

    const participantIds = Array.from(new Set([
      ...sent.map(m => m.recipient_id!),
      ...received.map(m => m.sender_id)
    ]));

    const conversations = await prisma.user.findMany({
      where: { user_id: { in: participantIds } },
      select: { user_id: true, username: true, email: true, avatar_url: true }
    });

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
      const unreadCount = await prisma.message.count({
        where: { sender_id: conv.user_id, recipient_id: userId, read_at: null }
      });
      return { ...conv, unreadCount };
    }));

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;

    // 1. Unread DMs
    const unreadDMs = await prisma.message.count({
      where: { recipient_id: userId, read_at: null }
    });

    // 2. Unread Group Messages
    // Fetch user's projects
    const memberships = await prisma.projectMember.findMany({
      where: { user_id: userId },
      select: { project_id: true }
    });
    const projectIds = memberships.map(m => m.project_id);

    // Fetch user's read receipts for these projects
    const receipts = await prisma.projectReadReceipt.findMany({
      where: { user_id: userId, project_id: { in: projectIds } }
    });

    let unreadGroups = 0;
    for (const pid of projectIds) {
      const receipt = receipts.find(r => r.project_id === pid);
      const lastRead = receipt ? receipt.last_read_at : new Date(0);
      
      const count = await prisma.message.count({
        where: { 
          project_id: pid, 
          sender_id: { not: userId },
          created_at: { gt: lastRead } 
        }
      });
      unreadGroups += count;
    }

    res.json({ totalUnread: unreadDMs + unreadGroups, dms: unreadDMs, groups: unreadGroups });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const { partner_id, project_id } = req.body;

    if (partner_id) {
      // Mark DMs from partner as read
      await prisma.message.updateMany({
        where: { sender_id: parseInt(partner_id, 10), recipient_id: userId, read_at: null },
        data: { read_at: new Date() }
      });
    } else if (project_id) {
      // Update/Create ProjectReadReceipt
      const pid = parseInt(project_id, 10);
      await prisma.projectReadReceipt.upsert({
        where: { project_id_user_id: { project_id: pid, user_id: userId } },
        update: { last_read_at: new Date() },
        create: { project_id: pid, user_id: userId, last_read_at: new Date() }
      });
    }

    // Notify user to refresh count
    getIO().to(`user_${userId}`).emit('unread_count_update');

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
