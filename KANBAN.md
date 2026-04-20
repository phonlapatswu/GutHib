# 🦈 Shark Task - Kanban Board

Track the development progress of the Shark Task Platform.

## 🟢 Done
- **Database Setup**: Initialized PostgreSQL, designed Prisma schema.
- **Backend Auth System**: Register, Login, Me endpoints with JWT & bcrypt.
- **Frontend Auth Integration**: Login/Register forms connected to API.
- **Frontend Layout & UI**: Core UI layout with Shark theme, glassmorphism, sidebar.
- **Project Management API**: Full project + task CRUD endpoints.
- **Task Assignment System**: Assign tasks to team members with dropdown picker.
- **Task Submission & Review Workflow**: Worker submits → Requester reviews → Merge/Request Changes → CommitLog.
- **Project Member Management**: Add/remove members per project (ProjectMember table).
- **User Profile Page**: Edit username/email + change password.
- **Admin Panel**: Manage all users, change roles, delete users (Admin role only).
- **Real Global Chat (Messages)**: DB-backed team chat with short-polling real-time updates.
- **Activity Inbox**: Real CommitLog-based timeline of all task events.
- **Analytics Page**: Visual stats on task status distribution.
- **Automated Testing**: Jest + Supertest test suite (29 tests, all passing, zero mocks).
- **Role Manager (Enterprise RBAC)**: Added Manager role. Only Managers/Admins can create projects/tasks, assign tasks, and delete projects/tasks.
- **Task Comments/Discussions**: ให้ทีมคุยกันภายใน Task ได้ ไม่ต้องออกไปที่แชทหลัก
- **File Attachments on Tasks**: แนบไฟล์ / ลิงก์รูปใน Task
- **Task Search & Filter**: ค้นหา Task ตามชื่อ, กรองตาม Priority / Status / Assignee
- **Notification Badge**: แสดงจำนวน inbox ใหม่บน Sidebar (Polling 30s)
- **Task Sub-task Creation UI**: สร้าง Sub-task ได้จากหน้า Task Detail 
- **Due Date Reminders / Overdue Badge**: แสดงเตือนเมื่องานใกล้ครบกำหนดหรือเลย deadline
- **Project Archive/Delete**: Owner/Admin/Manager สามารถปิดหรือลบโปรเจกต์ได้
- **Dashboard Stats Enhancement**: แสดง % completion ต่อโปรเจกต์บนหน้าหลัก

## 🟡 In Progress
*(No tasks currently in progress)*

## 🔴 To Do (แนะนำให้ทำต่อ — เรียงตามความสำคัญ)

### Priority 3 — Team Scale (สำหรับองค์กรที่ใหญ่ขึ้น)
- **Email Notifications**: ส่งอีเมลแจ้งเตือนเมื่อถูก Assign / งานใกล้ครบกำหนด
- **Real-time WebSocket Chat**: เปลี่ยนจาก polling เป็น Socket.io เพื่อแชทไวขึ้น
- **Third-party Integrations**: GitHub Webhook, Slack Notifications

### Priority 4 — Polish & Deployment
- **Mobile Responsive Sidebar**: ทำให้ Sidebar ใช้งานบนมือถือได้
- **Dark Mode**: ธีมมืดสำหรับผู้ใช้ที่ชอบ
- **Deploy to Production**: Vercel (Frontend) + Railway/Render (Backend) + Supabase (Database)

## ⚪️ Backlog (ไว้รอบหน้า)
- **Organization Multi-workspace**: แยก Workspace ต่างบริษัทออกจากกัน
- **Gantt Chart View**: มุมมองแสดงไทม์ไลน์โปรเจกต์แบบ Gantt
- **API Rate Limiting & Security Hardening**: ป้องกัน brute force + helmet.js
- **Audit Logs for Admin**: ประวัติการเปลี่ยนแปลงทั้งหมดสำหรับ Admin ดู
