import { Router, Request, Response } from 'express';
import { PrismaClient, Task } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const router = Router();
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper interface to construct the tree
interface TaskNode extends Task {
  sub_tasks: TaskNode[];
}


/**
 * GET /api/projects/:id/tasks
 * Fetches all tasks for a given project ID and returns them in a nested tree structure.
 */
router.get('/:id/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);

    if (isNaN(projectId)) {
      res.status(400).json({ error: 'Invalid project ID format' });
      return;
    }
    // Fetch all tasks for the project
    const tasks = await prisma.task.findMany({
      where: {
        project_id: projectId
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    if (!tasks || tasks.length === 0) {
      res.json([]);
      return;
    }

    // Build Task Tree
    const taskMap = new Map<number, TaskNode>();
    const rootTasks: TaskNode[] = [];

    // Initialize all tasks as nodes
    tasks.forEach(task => {
      taskMap.set(task.task_id, { ...task, sub_tasks: [] });
    });

    // Wire up parent-child relationships
    tasks.forEach(task => {
      const node = taskMap.get(task.task_id);
      if (node) {
        if (task.parent_task_id) {
          const parent = taskMap.get(task.parent_task_id);
          if (parent) {
            parent.sub_tasks.push(node);
          } else {
            // Parent isn't in this project or is missing, treat as root for safety
            rootTasks.push(node);
          }
        } else {
          // This is a root task
          rootTasks.push(node);
        }
      }
    });

    res.json(rootTasks);
  } catch (error) {
    console.error('Error fetching task tree:', error);
    res.status(500).json({ error: 'Failed to fetch task tree' });
  }
});

export default router;
