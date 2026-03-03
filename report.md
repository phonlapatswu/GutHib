รายงานความคืบหน้าโปรเจกต์ (Project Report)
ชื่อโปรเจกต์: GutHib (แพลตฟอร์มบริหารจัดการงานสไตล์ Repository)
1. รายชื่อสมาชิกกลุ่ม
นาย อภินัทธ์ ยศวราเลิศ 67102010178 
นาย ชัยสิทธิ์ ปลื้มสุทธิ์ 67102010510 
นาย พลภัทร เพ็ชรสินธพ 67102010523 


2. ข้อมูลเดิม (Phase 1)
ที่มาของปัญหาและความสำคัญ (Background & Significance) GutHib ได้รับแรงบันดาลใจมาจากความซับซ้อนในการใช้งาน GitHub สำหรับบุคคลทั่วไปหรือสายงานอื่นที่ไม่ใช่นักพัฒนาซอฟต์แวร์ แม้ว่า GitHub จะมีประสิทธิภาพสูงในการจัดการงานเป็นทีม โปรเจกต์นี้จึงมุ่งหวังที่จะสร้างแพลตฟอร์มที่คล้าย GitHub แต่ปรับให้เข้าถึงง่ายและเหมาะสมกับทุกสายงาน เพื่อให้การทำงานเป็นระบบมากขึ้น
จุดประสงค์ของ Project (Objectives)
พัฒนาเว็บแอปพลิเคชันด้วย Node.js สำหรับจัดการและกระจายงานขนาดใหญ่ให้เป็นงานย่อย (Micro-tasks)
สร้างระบบที่ช่วยให้การทำงานเป็นทีมมีความโปร่งใส ตรวจสอบได้ และเป็นระเบียบคล้ายการจัดการ Source Code
ประยุกต์ใช้ความรู้ด้าน Data Structure ในการจัดการลำดับความสำคัญและโครงสร้างของงาน
ศึกษาและฝึกฝนกระบวนการพัฒนาซอฟต์แวร์แบบ Agile (Scrum) และการควบคุมคุณภาพด้วย Automated Testing
ขอบเขตของ Project (Scope)
ระบบผู้ใช้งาน: รองรับผู้ใช้งาน 2 กลุ่มหลัก คือ ผู้สั่งงาน (Requester) และ ผู้รับผิดชอบงาน (Worker)
การจัดการงาน: สามารถสร้างโปรเจกต์หลัก และซอยย่อยเป็น Issue/Task ได้
ระบบสถานะ: งานจะมีสถานะ Open, In Progress, Review, และ Closed
การแสดงผล: รองรับการทำงานบน Web Browser (Responsive Design สำหรับ Mobile)
Functional Requirements (หลัก)
Task Management (Repository Style) ระบุรายละเอียดผ่าน Markdown ได้
Automated Task Splitting แตกงานย่อยด้วยโครงสร้างข้อมูลแบบ Tree
Task Claiming System ค้นหาและกดรับงานเพื่อสร้างกิ่งการทำงาน (Branch)
Proof-of-Work Submission ส่งผลงานพร้อมแนบหลักฐาน
Quality Control & Approval (Merging) ระบบ Accept งานและ Merge เข้าโปรเจกต์หลัก
Performance Analytics คำนวณสถิติ เช่น ค่าเฉลี่ยเวลา ค่าตอบแทน
Non-Functional Requirements (หลัก)
Test Coverage 100% (Unit Testing)
Scalability (Distributed Support) จัดการ Concurrency
Auditability & Traceability บันทึกประวัติ (Commit Log)
User Interface Responsiveness (Low Latency)
Security (Role-based Access)

3. Requirement ที่เปลี่ยนไป
ไม่มีการเปลี่ยนแปลง (ใช้ Functional และ Non-functional requirement ตามที่กำหนดไว้ใน Phase 1)

4. Design Document
Use Case Diagram
ข้อมูลโค้ด
flowchart LR
    %% Actors
    Req([Requester ผู้สั่งงาน])
    Work([Worker ผู้รับผิดชอบงาน])
    Admin([Admin / TA / อาจารย์])

    %% System Boundary
    subgraph GutHib System
        CreateProj(Create Project & Upload Tasks)
        Split(Split Tasks / Automated Task Splitting)
        Review(Review Work / Merge / Request Changes)
        Assign(Assign Task to Specific User)
        ViewAna(View Analytics)

        Search(Search Tasks)
        Claim(Claim Task / Create Branch)
        Submit(Submit Proof-of-Work)
        ViewStats(View Personal Stats)

        ViewProg(View Project Progress)
        Access(Access All Data / Audit Logging)
    end

    %% Requester Connections
    Req --> CreateProj
    Req --> Split
    Req --> Assign
    Req --> Review
    Req --> ViewAna

    %% Worker Connections
    Work --> Search
    Work --> Claim
    Work --> Submit
    Work --> ViewStats

    %% Admin Connections
    Admin --> ViewProg
    Admin --> Access


5. Screenshots
<img width="1186" height="733" alt="image" src="https://github.com/user-attachments/assets/8a3f35bc-f1c3-478c-8a46-b8abcf873b19" />


6. สิ่งที่เปลี่ยนแปลง (จาก Phase 1)
เพิ่มระบบ Direct Assignment: มีการปรับปรุงให้ผู้สั่งงาน (Requester) สามารถ Assign งานเจาะจงไปยังตัว User (Worker) คนใดคนหนึ่งได้โดยตรง
เหตุผล: เพื่อเพิ่มความยืดหยุ่นในกรณีที่เป็นงานเฉพาะทาง หรือมีผู้รับผิดชอบที่ตกลงกันไว้แล้ว ทำให้ลดขั้นตอนการค้นหาและกดรับงาน (Claim) ของ Worker ลง และช่วยให้การติดตามความรับผิดชอบชัดเจนยิ่งขึ้น

7. กระบวนการทำงานใหม่ (Process, Methods, and Tools)
ทีมใช้กระบวนการพัฒนาแบบ Agile (Scrum Framework) โดยมีรายละเอียดดังนี้:
1. ระยะเวลาและการจัดการ Sprint
ความยาว Sprint (Sprint Duration): กำหนดไว้ที่ 2 สัปดาห์ (2 Weeks) ต่อ 1 Sprint
พิธีกรรม Scrum (Scrum Events):
มีการทำ Weekly Stand-up meeting เพื่ออัปเดตสถานะงานและปัญหา (Blocker)
จัด Sprint Planning ก่อนเริ่ม Sprint และจัด Retrospective เมื่อจบ Sprint (อ้างอิงวิดีโอ Retrospective: https://youtu.be/vkzCbIviAh4?si=ToOB4ghBk_POxdea)
2. เครื่องมือและวิธีการ Track Status งาน
ใช้ GitHub Projects (Kanban Board) ในการจัดการ Product Backlog และ Sprint Backlog
จัดการแบ่งสถานะงานผ่านคอลัมน์ชัดเจน (เช่น Todo, In Progress, In Review, Done)
3. กฎการตั้งชื่อ Branch (Branch Naming Convention) ทีมตกลงใช้รูปแบบการตั้งชื่อ Branch เพื่อให้ง่ายต่อการติดตามและสอดคล้องกับ Issue โดยใช้โครงสร้าง: <ประเภทของการทำงาน>/<รหัส-Issue>-<ชื่องานสั้นๆ>
feat/GH-01-login-system (สำหรับการสร้างฟีเจอร์ใหม่)
fix/GH-05-button-bug (สำหรับการแก้บั๊ก)
docs/GH-08-update-readme (สำหรับการเขียนหรือแก้เอกสาร)
refactor/GH-10-restructure-api (สำหรับการปรับปรุงโค้ดโดยไม่เปลี่ยนฟังก์ชัน)
4. กฎการเขียน Commit Message (Commit Message Format) ทีมใช้มาตรฐาน Conventional Commits เพื่อให้ประวัติการทำงานอ่านง่ายและนำไปทำ Automated Release Note ได้ โดยใช้รูปแบบ: <type>(<scope>): <subject>
ตัวอย่างการใช้งาน:
feat(auth): เพิ่มระบบลงชื่อเข้าใช้ด้วย JWT
fix(ui): แก้ไขปุ่มกดรับงานไม่แสดงผลบนมือถือ
docs(readme): เพิ่มวิธีการรันโปรเจกต์ในเครื่อง local
style(css): จัดรูปแบบโค้ดหน้า dashboard ใหม่
5. ช่องทางและวิธีการสื่อสารในทีม
ใช้ Discord
มีการรวบรวม Requirement และเก็บข้อมูลด้วยการสัมภาษณ์แบบวิดีโอ (อ้างอิงวิดีโอ Requirement Gathering: https://youtu.be/NaG_dEiouVI?si=Y6V9zp6aQH_B4za8)

