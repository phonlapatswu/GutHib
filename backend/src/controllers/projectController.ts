import { Request, Response } from 'express';
import prisma from '../db';
import * as yup from 'yup';

/**
 * Fetches all active projects for the current user
 * Filters by ownership and membership. Adjoined with completion stats and unread messages.
 */
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.user_id;
    const userRole = (req as any).user.role;

    const whereClause: any = { status: 'Active' };

    // Standard Privacy Filter: Only Owner, Members, or Admins can see.
    if (userRole !== 'Admin') {
      whereClause.OR = [
        { owner_id: userId },
        { members: { some: { user_id: userId } } }
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        owner: { select: { username: true, avatar_url: true } },
        members: { include: { user: { select: { user_id: true, username: true, email: true, role: true, avatar_url: true } } } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Enrich with completion stats and unread counts
    const enriched = await Promise.all(projects.map(async (p) => {
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { project_id: p.project_id },
        _count: true,
      });
      const total = taskStats.reduce((s, t) => s + t._count, 0);
      const closed = taskStats.find(t => t.status === 'Closed')?._count || 0;
      const completionRate = total === 0 ? 0 : Math.round((closed / total) * 100);

      // Unread messages logic
      const receipt = await prisma.projectReadReceipt.findUnique({
        where: { project_id_user_id: { project_id: p.project_id, user_id: userId } }
      });
      const lastRead = receipt ? receipt.last_read_at : new Date(0);
      const unreadCount = await prisma.message.count({
        where: { project_id: p.project_id, sender_id: { not: userId }, created_at: { gt: lastRead } }
      });

      return { ...p, taskStats, completionRate, unreadCount };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Creates a new project and attaches the creator as a member
 * Automatically handles deduplication of member IDs
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const schema = yup.object().shape({
      title: yup.string().required().max(255),
      description: yup.string().optional(),
      end_date: yup.date().nullable().optional(),
      members: yup.array().of(yup.number()).optional(),
    });
    await schema.validate(req.body);

    const { title, description, end_date, members } = req.body;
    const userId = (req as any).user.user_id;

    // Prepare member list: owner + selected members (deduplicated)
    const memberIds = Array.from(new Set([userId, ...(members || [])]));

    const project = await prisma.project.create({
      data: {
        title,
        description,
        owner_id: userId,
        end_date: end_date ? new Date(end_date) : null,
        members: {
          create: memberIds.map((id: number) => ({
            user_id: id
          }))
        }
      },
      include: { 
        owner: { select: { username: true } },
        members: { include: { user: { select: { username: true } } } }
      },
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof yup.ValidationError) { res.status(400).json({ error: error.message }); return; }
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Sets project status to 'Archived' (Owner or Admin only)
 */
export const archiveProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const userId = (req as any).user.user_id;
    const userRole = (req as any).user.role;

    const project = await prisma.project.findUnique({ where: { project_id: projectId } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    if (project.owner_id !== userId && userRole !== 'Admin') {
      res.status(403).json({ error: 'Only the project owner or Admin can archive projects' }); return;
    }

    const updated = await prisma.project.update({
      where: { project_id: projectId },
      data: { status: 'Archived' },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Permanently deletes a project and all its associations (Owner or Admin only)
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const userId = (req as any).user.user_id;
    const userRole = (req as any).user.role;

    const project = await prisma.project.findUnique({ where: { project_id: projectId } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    if (project.owner_id !== userId && userRole !== 'Admin') {
      res.status(403).json({ error: 'Only the project owner or Admin can delete projects' }); return;
    }

    await prisma.project.delete({ where: { project_id: projectId } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Retrieves the list of all members assigned to a specific project
 */
export const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    if (isNaN(projectId)) { res.status(400).json({ error: 'Invalid project ID' }); return; }

    const members = await prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: { user: { select: { user_id: true, username: true, email: true, role: true, avatar_url: true } } },
      orderBy: { joined_at: 'asc' },
    });
    res.json(members.map(m => ({ ...m.user, joined_at: m.joined_at })));
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Adds a new member to the project by their username
 */
export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const { username } = req.body;
    if (!username) { res.status(400).json({ error: 'username is required' }); return; }

    const userToAdd = await prisma.user.findUnique({
      where: { username },
      select: { user_id: true, username: true, email: true, role: true },
    });
    if (!userToAdd) { res.status(404).json({ error: `User "${username}" not found` }); return; }

    const existing = await prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: projectId, user_id: userToAdd.user_id } },
    });
    if (existing) { res.status(409).json({ error: 'User is already a member' }); return; }

    await prisma.projectMember.create({ data: { project_id: projectId, user_id: userToAdd.user_id } });
    res.status(201).json(userToAdd);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Removes a member from the project (cannot remove owner)
 */
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = parseInt(req.params.id as string, 10);
    const userId = parseInt(req.params.userId as string, 10);

    const project = await prisma.project.findUnique({ where: { project_id: projectId } });
    if (project?.owner_id === userId) { res.status(400).json({ error: 'Cannot remove the project owner' }); return; }

    await prisma.projectMember.delete({
      where: { project_id_user_id: { project_id: projectId, user_id: userId } },
    });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
