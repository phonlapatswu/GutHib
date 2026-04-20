import { Request, Response } from 'express';
import prisma from '../db';
import bcrypt from 'bcrypt';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { user_id: true, username: true, email: true, role: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const tasks = await prisma.task.findMany({
      where: { assignee_id: userId },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInboxLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const logs = await prisma.commitLog.findMany({
      where: {
        OR: [{ user_id: userId }, { task: { assignee_id: userId } }],
      },
      include: {
        user: { select: { username: true } },
        task: { select: { title: true, project: { select: { title: true } } } },
      },
      orderBy: { timestamp: 'desc' },
      take: 30,
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching inbox logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getInboxCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    // Count recent logs (last 24h) not triggered by self
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.commitLog.count({
      where: {
        timestamp: { gte: since },
        user_id: { not: userId }, // not self-actions
        OR: [
          { task: { assignee_id: userId } }, // actions on my tasks
        ],
      },
    });
    res.json({ unread: count });
  } catch (error) {
    console.error('Error fetching inbox count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, username: true, email: true, role: true, created_at: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: { assignee_id: userId },
      _count: true,
    });

    res.json({ ...user, taskStats });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const { username, email } = req.body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    const user = await prisma.user.update({
      where: { user_id: userId },
      data: updateData,
      select: { user_id: true, username: true, email: true, role: true },
    });
    res.json(user);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Username or email already taken' });
      return;
    }
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'currentPassword and newPassword (min 6 chars) are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { user_id: userId }, data: { password_hash: newHash } });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Admin-only endpoints
export const adminGetUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterRole = (req as any).user.role;
    if (requesterRole !== 'Admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const users = await prisma.user.findMany({
      select: { user_id: true, username: true, email: true, role: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error in adminGetUsers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const adminUpdateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterRole = (req as any).user.role;
    if (requesterRole !== 'Admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const targetId = parseInt(req.params.userId as string, 10);
    const { role } = req.body;
    if (!['Requester', 'Worker', 'Admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    const user = await prisma.user.update({
      where: { user_id: targetId },
      data: { role },
      select: { user_id: true, username: true, role: true },
    });
    res.json(user);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const adminDeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterRole = (req as any).user.role;
    if (requesterRole !== 'Admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    const targetId = parseInt(req.params.userId as string, 10);
    const requesterId = (req as any).user.user_id;
    if (targetId === requesterId) {
      res.status(400).json({ error: 'Cannot delete yourself' });
      return;
    }
    await prisma.user.delete({ where: { user_id: targetId } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
