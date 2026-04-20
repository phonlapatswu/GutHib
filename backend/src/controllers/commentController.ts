import { Request, Response } from 'express';
import prisma from '../db';

// GET /api/projects/:projectId/tasks/:taskId/comments
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    if (isNaN(taskId)) { res.status(400).json({ error: 'Invalid task ID' }); return; }

    const comments = await prisma.taskComment.findMany({
      where: { task_id: taskId },
      include: { author: { select: { user_id: true, username: true } } },
      orderBy: { created_at: 'asc' },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/projects/:projectId/tasks/:taskId/comments
export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    const authorId = (req as any).user.user_id;
    const { content, file_url } = req.body;

    if (!content || content.trim() === '') {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    const comment = await prisma.taskComment.create({
      data: {
        task_id: taskId,
        author_id: authorId,
        content: content.trim(),
        file_url: file_url || null,
      },
      include: { author: { select: { user_id: true, username: true } } },
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId/comments/:commentId
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const commentId = parseInt(req.params.commentId as string, 10);
    const requesterId = (req as any).user.user_id;
    const requesterRole = (req as any).user.role;

    const comment = await prisma.taskComment.findUnique({ where: { comment_id: commentId } });
    if (!comment) { res.status(404).json({ error: 'Comment not found' }); return; }

    // Only author or Admin can delete
    if (comment.author_id !== requesterId && requesterRole !== 'Admin') {
      res.status(403).json({ error: 'You can only delete your own comments' });
      return;
    }

    await prisma.taskComment.delete({ where: { comment_id: commentId } });
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
