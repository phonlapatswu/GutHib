# GutHib
## ที่มาของปัญหาและความสำคัญ (Background & Significance)

ที่มาก็คือผมเรียนวิชานี้นี่แหละ แล้วก็ได้ลองใช้github แล้วรู้สึกว่าทำไมศัพท์หรือว่าการทำงานหลักการอะไรมันถึงได้ยุ้งยากขนาดนี้ ทั้งที่จริงๆGitHub มีประสิทธิภาพในการบริหารจัดการงานเป็นทีมมากๆ(จะมากยิ่งๆในด้านสายเทค) แล้วถ้าผมทำแพลดฟอรฺ์มที่คล้ายๆGitHubขึ้นมาหล่ะ แล้วผมจะทำให้มันเหมาะกับทุกๆสายงาน คงจะทำให้งานของคนอื้นๆทำได้เป็นระบบน่าดูเลยเกิดโปรเจ็ค GutHib(ผวนมาจากGitHub) ขึ้นมาก

## จุดประสงค์ของ Project (Objectives)
-เพื่อพัฒนาเว็บแอปพลิเคชันด้วย Node.js สำหรับจัดการและกระจายงานขนาดใหญ่ให้กลายเป็นงานย่อย (Micro-tasks)
-เพื่อสร้างระบบที่ช่วยให้การทำงานเป็นทีมมีความโปร่งใส ตรวจสอบได้ และเป็นระเบียบคล้ายการจัดการ Source Code
-เพื่อประยุกต์ใช้ความรู้ด้าน Data Structure ในการจัดการลำดับความสำคัญและโครงสร้างของงาน
-เพื่อศึกษาและฝึกฝนกระบวนการพัฒนาซอฟต์แวร์แบบ Agile (Scrum) และการควบคุมคุณภาพด้วย Automated Testing


## ขอบเขตของ Project (Scope)
-ระบบผู้ใช้งาน: รองรับผู้ใช้งาน 2 กลุ่มหลัก คือ ผู้สั่งงาน (Requester) และ ผู้รับผิดชอบงาน (Worker)![IMG_8784](https://github.com/user-attachments/assets/a9f19368-fa87-4b46-9b28-51d20babf040)

-การจัดการงาน: สามารถสร้างโปรเจกต์หลัก และซอยย่อยเป็น Issue/Task ได้
-ระบบสถานะ: งานจะมีสถานะ Open, In Progress, Review , และ Closed
-การแสดงผล: รองรับการทำงานบน Web Browser (Responsive Design สำหรับ Mobile)
-ข้อจำกัด: ระบบในเวอร์ชันเริ่มต้นจะเน้นการจัดการสถานะและข้อมูลงานในรูปแบบข้อความและไฟล์แนบพื้นฐาน

# Requirement

## Functional Requirements
-Task Management (Repository Style): เจ้าของโครงการสามารถสร้างโปรเจกต์และอัปโหลดงานใหญ่ โดยระบบจะอนุญาตให้ระบุรายละเอียดผ่านไฟล์ Markdown ได้ 
-Automated Task Splitting: ระบบต้องสามารถแตกงานใหญ่ (Root) ออกเป็นงานย่อยๆ (Sub-tasks) โดยใช้โครงสร้างข้อมูลแบบ Tree เพื่อจัดการความสัมพันธ์ของงาน.
-Task Claiming System: ผู้ใช้ทั่วไปสามารถค้นหางาน (Search Method) และกดรับงาน (Claim) เพื่อสร้างกิ่งก้านการทำงานของตนเอง (คล้ายการสร้าง Branch).
-Proof-of-Work Submission: ผู้ใช้สามารถส่งผลงานผ่านระบบเพื่อรอการตรวจสอบ (Review) โดยต้องมีการแนบหลักฐานการทำงานตามที่ระบบกำหนด .
-Quality Control & Approval (Merging): เจ้าของโครงการสามารถกด Accept เพื่อยืนยันว่างานย่อยนั้นสำเร็จแล้ว และระบบจะ "Merge" ข้อมูลกลับเข้าสู่โปรเจกต์หลัก.
-Performance Analytics: ระบบต้องมีการคำนวณสถิติ เช่น ค่าเฉลี่ยเวลาที่ใช้ หรือ ค่าตอบแทนสูงสุด/ต่ำสุด ในโครงการนั้นๆ โดยใช้ Method การคำนวณที่กำหนด.


## Non-Functional Requirements
-Test Coverage: ระบบต้องถูกออกแบบมาให้รองรับการทดสอบ (Unit Testing) โดยมีเป้าหมาย Coverage 100% ตามข้อกำหนดของรายวิชา.
-Scalability (Distributed Support): ระบบต้องสามารถรองรับ User จำนวนมากที่เข้ามากดรับงานพร้อมกันได้โดยไม่เกิดข้อมูลทับซ้อน (Concurrency Management).
-Auditability & Traceability: ทุกการกระทำในระบบ (การรับงาน/ส่งงาน) ต้องถูกบันทึกประวัติคล้าย Commit Log ของ GitHub เพื่อตรวจสอบย้อนหลังได้.
-User Interface Responsiveness: เนื่องจากเน้นการทำงานบนมือถือ เว็บแอปพลิเคชันต้องเป็นแบบ Responsive ที่โหลดข้อมูลได้รวดเร็ว (Low Latency).
-Project Organization Compliance: ระบบต้องรองรับการจัดระเบียบงานด้วย Label, Priority, และ Milestone เพื่อให้การทำงานร่วมกันมีประสิทธิภาพ.
-Security (Access Control): ต้องมีการจัดการสิทธิ์ในการเข้าถึง (Role-based Access) โดยเฉพาะการอนุญาตให้ อาจารย์และ TA เข้าถึงโปรเจกต์เพื่อตรวจงานได้.

## Use Case Diagram
-Requester: Create Project, Split Tasks, Review Work, View Analytics
-Worker: Search Tasks, Claim Task, Submit Work, View Personal Stats
-Admin (TA/Professor): View Project Progress, Access All Data

## Core Use Cases:
-การกระจายงาน (Task Splitting): เมื่อมีงานใหญ่เข้ามา Requester จะใช้ระบบแตกเป็นงานย่อย (Sub-tasks) ซึ่งหลังบ้านจะถูกจัดเก็บด้วยโครงสร้างข้อมูลแบบ Tree
-การรับและส่งงาน (The Workflow): Worker กดรับงาน -> สถานะเปลี่ยนเป็น In Progress -> ส่งงาน -> เข้าสู่สถานะ Review เพื่อให้ Requester ตัดสินใจว่าจะ Merge (เสร็จสิ้น) หรือ Request Changes (ต้องแก้ไข)

## กระบวนการทำงาน (Process, Methods, and Tools)
เราใช้กระบวนการพัฒนาแบบ Agile (Scrum Framework) แบ่งการทำงานเป็น Sprints
Process: Weekly Stand-up meeting, Sprint Planning, Retrospective
Design Tools: Figma (สำหรับ UI/UX)
Development Tools: VS Code, Git
Project Management: GitHub Projects (Kanban Board)
Communication: Discord / Microsoft Teams


สรุปขั้นตอนการทำ Requirement (Requirement Gathering)
🎥 Interview Video: https://youtu.be/NaG_dEiouVI?si=Y6V9zp6aQH_B4za8


สรุปการประชุม Retrospective
Video:https://youtu.be/vkzCbIviAh4?si=ToOB4ghBk_POxdea


Project Management Screenshots (GitHub Projects)

9.1 Product Backlog
![IMG_8784](https://github.com/user-attachments/assets/083fe084-2ca7-4f42-87c1-3080b6ebfe6e)


9.2 Sprint Backlog (Sprint 1)
![IMG_8785](https://github.com/user-attachments/assets/a66f7f1c-12f6-4b1c-bd57-fe30bb65cf4c)


9.3 Example of Issue Detail
![IMG_8786](https://github.com/user-attachments/assets/99f19435-173e-4e21-aa57-d0e2a2602d5c)
