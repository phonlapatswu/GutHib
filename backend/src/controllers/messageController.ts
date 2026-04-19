import { Request, Response } from 'express';
import prisma from '../db';

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        sender: {
          select: { username: true }
        }
      }
    });

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    const senderId = (req as any).user.user_id;

    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Message text is required' });
      return;
    }

    const newMessage = await prisma.message.create({
      data: {
        text,
        sender_id: senderId
      },
      include: {
        sender: {
          select: { username: true }
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
