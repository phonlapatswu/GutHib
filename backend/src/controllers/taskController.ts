import { Request, Response } from 'express';
import prisma from '../db';
import { task_status, task_priority } from '@prisma/client';

/**
 * Updates the status of a specific task within a project
 * Handles date recording for In_Progress and Closed states
 */
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

    const userId = (req as any).user.user_id;
    const userRole = (req as any).user.role;

    const existingTask = await prisma.task.findFirst({
      where: { task_id: taskId, project_id: projectId },
      include: { 
        project: { select: { owner_id: true } },
        assignees: { select: { user_id: true } }
      }
    });

    if (!existingTask) {
      res.status(404).json({ error: 'Task not found in this project' });
      return;
    }

    const isOwner = existingTask.project.owner_id === userId;
    const isManager = userRole === 'Admin' || userRole === 'Manager';
    const isAssignee = existingTask.assignees.some(a => a.user_id === userId);

    if (!isOwner && !isManager && !isAssignee) {
      res.status(403).json({ error: 'You do not have permission to update this task status' });
      return;
    }

    // Restrict "Closed" to Managers/Owners only (Assignees cannot close tasks themselves)
    if (status === task_status.Closed && !isOwner && !isManager) {
      res.status(403).json({ error: 'Only Managers or the Project Owner can close tasks' });
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

/**
 * Creates a new task within a project and assigns users
 * Only Managers/Admins can assign tasks during creation
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.projectId as string, 10);
    const { title, description, assignee_ids, due_date, planned_start_date, priority } = req.body;
    const requesterRole = (req as any).user?.role;

    if (isNaN(projectId) || !title) {
      res.status(400).json({ error: 'Valid project ID and title are required' });
      return;
    }

    // Only Manager and Admin can assign tasks to others
    const canAssign = requesterRole === 'Manager' || requesterRole === 'Admin';
    const resolvedAssigneeIds = canAssign && Array.isArray(assignee_ids) 
      ? assignee_ids.map((id: any) => parseInt(id, 10)) 
      : [];

    const task = await prisma.task.create({
      data: {
        project_id: projectId,
        title,
        description,
        priority: priority as task_priority || task_priority.Medium,
        due_date: due_date ? new Date(due_date) : null,
        planned_start_date: planned_start_date ? new Date(planned_start_date) : null,
        assignees: {
          create: resolvedAssigneeIds.map(userId => ({ user_id: userId }))
        }
      },
      include: {
        assignees: { include: { user: { select: { user_id: true, username: true } } } },
        project: { select: { title: true } },
      }
    });

    // Log the assignment
    if (resolvedAssigneeIds.length > 0) {
      await prisma.commitLog.create({
        data: {
          task_id: task.task_id,
          user_id: (req as any).user.user_id,
          action: 'Claim',
          message: `Task assigned to: ${task.assignees.map(a => a.user.username).join(', ')}`,
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

/**
 * Retrieves detailed information for a specific task including assignees and history
 */
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
        assignees: { include: { user: { select: { user_id: true, username: true, email: true } } } },
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
          include: { assignees: { include: { user: { select: { username: true } } } } },
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

/**
 * Updates task details including title, description, and assignees
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const taskId = parseInt(req.params.taskId as string, 10);
    if (isNaN(taskId)) {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    const { title, description, assignee_ids, due_date, planned_start_date, priority, status } = req.body;
    const requesterRole = (req as any).user?.role;
    const canAssign = requesterRole === 'Manager' || requesterRole === 'Admin';

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    // Handle multiple assignees
    if (assignee_ids !== undefined && canAssign) {
      const ids = Array.isArray(assignee_ids) ? assignee_ids.map(id => parseInt(id, 10)) : [];
      
      // Update by deleting all existing assignments and creating new ones
      await prisma.taskAssignee.deleteMany({ where: { task_id: taskId } });
      updateData.assignees = {
        create: ids.map(userId => ({ user_id: userId }))
      };
    }

    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date) : null;
    if (planned_start_date !== undefined) updateData.planned_start_date = planned_start_date ? new Date(planned_start_date) : null;
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
        assignees: { include: { user: { select: { user_id: true, username: true } } } },
        project: { select: { title: true } },
      },
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

/**
 * Deletes a task from the project (Manager/Admin only)
 */
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
