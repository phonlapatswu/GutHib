import { Request, Response } from 'express';
import prisma from '../db';
import { task_status, task_priority } from '@prisma/client';

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const taskId = parseInt(req.params.taskId as string, 10);
    const { status } = req.body;

    if (isNaN(projectId) || isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid project ID or task ID format' });
      return;
    }

    if (!status || !Object.values(task_status).includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${Object.values(task_status).join(', ')}` });
      return;
    }

    const existingTask = await prisma.task.findFirst({
      where: { task_id: taskId, project_id: projectId },
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found in this project' });
      return;
    }

    const updateData: any = { status: status as task_status };
    if (status === task_status.In_Progress && !existingTask.started_at) {
      updateData.started_at = new Date();
    } else if (status === task_status.Closed) {
      updateData.completed_at = new Date();
    }

    const updatedTask = await prisma.task.update({
      where: { task_id: taskId },
      data: updateData,
    });

    res.json({ message: 'Task status updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const { title, description, assignee_id, due_date, priority } = req.body;
    const requesterRole = (req as any).user?.role;

    if (isNaN(projectId) || !title) {
      res.status(400).json({ error: 'Valid project ID and title are required' });
      return;
    }

    // Only Manager and Admin can assign tasks to others
    const canAssign = requesterRole === 'Manager' || requesterRole === 'Admin';
    const resolvedAssigneeId = canAssign && assignee_id ? parseInt(assignee_id, 10) : null;

    const task = await prisma.task.create({
      data: {
        project_id: projectId,
        title,
        description,
        priority: priority as task_priority || task_priority.Medium,
        assignee_id: resolvedAssigneeId,
        due_date: due_date ? new Date(due_date) : null,
      },
      include: {
        assignee: { select: { user_id: true, username: true } },
        project: { select: { title: true } },
      }
    });

    // Log the assignment as a Claim action
    if (task.assignee_id) {
      await prisma.commitLog.create({
        data: {
          task_id: task.task_id,
          user_id: (req as any).user.user_id,
          action: 'Claim',
          message: `Task assigned to ${task.assignee?.username}`,
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const task = await prisma.task.findUnique({
      where: { task_id: taskId },
      include: {
        assignee: { select: { user_id: true, username: true, email: true } },
        project: { select: { project_id: true, title: true, owner_id: true } },
        commits: {
          include: { user: { select: { username: true } } },
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        submissions: {
          include: { worker: { select: { username: true } } },
          orderBy: { submitted_at: 'desc' },
        },
        sub_tasks: {
          include: { assignee: { select: { username: true } } },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const { title, description, assignee_id, due_date, priority, status } = req.body;
    const requesterRole = (req as any).user?.role;
    const canAssign = requesterRole === 'Manager' || requesterRole === 'Admin';

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    // Only Manager/Admin may change the assignee
    if (assignee_id !== undefined && canAssign) {
      updateData.assignee_id = assignee_id ? parseInt(assignee_id, 10) : null;
    }
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (priority !== undefined) updateData.priority = priority as task_priority;
    if (status !== undefined && Object.values(task_status).includes(status)) {
      updateData.status = status as task_status;
      if (status === task_status.In_Progress) updateData.started_at = new Date();
      if (status === task_status.Closed) updateData.completed_at = new Date();
    }

    const task = await prisma.task.update({
      where: { task_id: taskId },
      data: updateData,
      include: {
        assignee: { select: { user_id: true, username: true } },
        project: { select: { title: true } },
      },
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    const requesterRole = (req as any).user?.role;

    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    // Only Manager and Admin can delete tasks
    if (requesterRole !== 'Manager' && requesterRole !== 'Admin') {
      res.status(403).json({ error: 'Only Managers can delete tasks' });
      return;
    }

    await prisma.task.delete({ where: { task_id: taskId } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
