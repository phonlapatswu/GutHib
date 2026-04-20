import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const tasks = await prisma.task.findMany({
    include: {
      assignees: {
        include: {
          user: true
        }
      }
    }
  });
  console.log(tasks);
}
