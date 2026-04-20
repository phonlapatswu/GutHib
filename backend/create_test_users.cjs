require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Admin1234!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sharktask.com' },
    update: { 
      role: 'Admin',
      password_hash: passwordHash,
      username: 'shark_admin'
    },
    create: {
      email: 'admin@sharktask.com',
      username: 'shark_admin',
      password_hash: passwordHash,
      role: 'Admin'
    }
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@sharktask.com' },
    update: { 
      role: 'Manager',
      password_hash: passwordHash,
      username: 'shark_manager'
    },
    create: {
      email: 'manager@sharktask.com',
      username: 'shark_manager',
      password_hash: passwordHash,
      role: 'Manager'
    }
  });

  console.log('Test accounts updated/created:');
  console.log('Role: Admin => Username: shark_admin | Password: Admin1234!');
  console.log('Role: Manager => Username: shark_manager | Password: Admin1234!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
