import { Request, Response } from 'express';
import prisma from '../db';

// POST /api/projects/:projectId/tasks/:taskId/submit
export const createSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    const workerId = (req as any).user.user_id;
    const { content, file_url } = req.body;

    if (!content && !file_url) {
      res.status(400).json({ error: 'Submission must include content or file_url' });
      return;
    }

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const submission = await prisma.submission.create({
      data: { task_id: taskId, worker_id: workerId, content, file_url },
      include: { worker: { select: { username: true } } },
    });

    // Update task status to Review
    await prisma.task.update({
      where: { task_id: taskId },
      data: { status: 'Review' },
    });

    // Log the submission
    await prisma.commitLog.create({
      data: {
        task_id: taskId,
        user_id: workerId,
        action: 'Submit',
        message: content?.substring(0, 100),
      },
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PATCH /api/projects/:projectId/tasks/:taskId/review
export const reviewSubmission = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    const reviewerId = (req as any).user.user_id;
    const { action, message } = req.body; // action: 'Merge' | 'Request_Changes'

    if (!['Merge', 'Request_Changes'].includes(action)) {
      res.status(400).json({ error: 'action must be "Merge" or "Request_Changes"' });
      return;
    }

    const task = await prisma.task.findUnique({ where: { task_id: taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (task.status !== 'Review') {
      res.status(400).json({ error: 'Task must be in Review status to review' });
      return;
    }

    // Update task status based on review decision
    const newStatus = action === 'Merge' ? 'Closed' : 'In_Progress';
    const updateData: any = { status: newStatus };
    if (action === 'Merge') {
      updateData.completed_at = new Date();
      updateData.merged_at = new Date();
    }

    await prisma.task.update({ where: { task_id: taskId }, data: updateData });

    // Log the review
    await prisma.commitLog.create({
      data: {
        task_id: taskId,
        user_id: reviewerId,
        action: action === 'Merge' ? 'Merge' : 'Request_Changes',
        message: message || (action === 'Merge' ? 'Work approved and merged.' : 'Changes requested.'),
      },
    });

    res.json({ message: `Task ${action === 'Merge' ? 'merged successfully' : 'sent back for changes'}` });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
