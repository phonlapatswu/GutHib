import { Router, Request, Response } from 'express';
import { Task } from '@prisma/client';
import prisma from '../db';
import { updateTaskStatus, createTask, getTask, updateTask, deleteTask } from '../controllers/taskController';
import { getProjects, createProject, getProjectMembers, addMember, removeMember, archiveProject, deleteProject } from '../controllers/projectController';
import { createSubmission, reviewSubmission } from '../controllers/submissionController';
import { getComments, createComment, deleteComment } from '../controllers/commentController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// Projects — read: anyone | write: Manager+ only
router.get('/', getProjects);
router.post('/', requireRole('Manager'), createProject);
router.patch('/:id/archive', requireRole('Manager'), archiveProject);
router.delete('/:id', requireRole('Manager'), deleteProject);

// Project Members — Manager+ only can manage
router.get('/:id/members', getProjectMembers);
router.post('/:id/members', requireRole('Manager'), addMember);
router.delete('/:id/members/:userId', requireRole('Manager'), removeMember);

// Tasks — Manager creates & assigns; Workers/Requesters just read & update status
router.post('/:projectId/tasks', requireRole('Manager'), createTask);


// Tasks — individual CRUD
router.get('/:projectId/tasks/:taskId', getTask);
router.put('/:projectId/tasks/:taskId', updateTask);
router.delete('/:projectId/tasks/:taskId', deleteTask);
router.patch('/:projectId/tasks/:taskId/status', updateTaskStatus);

// Task workflow
router.post('/:projectId/tasks/:taskId/submit', createSubmission);
router.patch('/:projectId/tasks/:taskId/review', reviewSubmission);

// Task Comments
router.get('/:projectId/tasks/:taskId/comments', getComments);
router.post('/:projectId/tasks/:taskId/comments', createComment);
router.delete('/:projectId/tasks/:taskId/comments/:commentId', deleteComment);

// Helper interface for task tree
interface TaskNode extends Task { sub_tasks: TaskNode[]; }

// GET /api/projects/:id/tasks — returns nested tree
router.get('/:id/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    if (isNaN(projectId)) { res.status(400).json({ error: 'Invalid project ID' }); return; }

    const tasks = await prisma.task.findMany({
      where: { project_id: projectId },
      include: { assignees: { include: { user: { select: { user_id: true, username: true } } } } },
      orderBy: { created_at: 'asc' },
    });

    if (!tasks || tasks.length === 0) { res.json([]); return; }

    const taskMap = new Map<number, TaskNode>();
    const rootTasks: TaskNode[] = [];
    tasks.forEach(task => taskMap.set(task.task_id, { ...task, sub_tasks: [] }));
    tasks.forEach(task => {
      const node = taskMap.get(task.task_id);
      if (node) {
        if (task.parent_task_id) {
          const parent = taskMap.get(task.parent_task_id);
          if (parent) parent.sub_tasks.push(node);
          else rootTasks.push(node);
        } else { rootTasks.push(node); }
      }
    });

    res.json(rootTasks);
  } catch (error) {
    console.error('Error fetching task tree:', error);
    res.status(500).json({ error: 'Failed to fetch task tree' });
  }
});

export default router;
