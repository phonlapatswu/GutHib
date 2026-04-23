# 🦈 Shark Task — บทพูดนำเสนอ (Process-Focused)
> วิชา Software Engineering | เน้น: กระบวนการทำงานจริง ไม่ใช่แค่ตัว Code

---

## 🖥️ Slide 1 — Title

> หน้าจอ: เปิด Presentation

**บทพูด:**
"สวัสดีครับอาจารย์และเพื่อนๆ วันนี้ผมจะนำเสนอโปรเจกต์ **Shark Task**
ซึ่งเป็น Task Management Platform ที่สำคัญกว่าตัวฟีเจอร์บนเว็บ
คือ **กระบวนการที่เราใช้สร้างมันขึ้นมา** ตั้งแต่ต้นจนจบครับ"

---

## 🖥️ Slide 2 — สิ่งที่จะนำเสนอ (Agenda)

**บทพูด:**
"วันนี้เราจะเดินตาม Engineering Process ทีละขั้นครับ ตั้งแต่
กระบวนการออกแบบ → การเขียน Code → การทดสอบ → การวัดประสิทธิภาพ
และสุดท้ายคือระบบ CI/CD ที่ทำให้ทุกอย่างทำงานอัตโนมัติ
ก่อนจะปิดท้ายด้วย Demo ของเว็บจริงครับ"

---

## 🖥️ Slide 3 — SDLC: กระบวนการพัฒนา

**บทพูด:**
"เราเลือกโมเดล **Iterative & Incremental** ครับ
เหตุผลคือ ความต้องการของระบบเราซับซ้อนและมีการเพิ่มฟีเจอร์ต่อเนื่อง
แบบ Waterfall ไม่เหมาะครับเพราะถ้าออกแบบทีเดียวทั้งหมดแล้วแก้ไขในภายหลังจะยาก

เราแบ่งเป็น 4 Phase:
- **Phase 1**: วิเคราะห์ requirement → ออกแบบ Database Schema → กำหนด API Contract ก่อนเขียน Code
- **Phase 2**: Build ฟีเจอร์ทีละ Sprint เช่น Auth ก่อน แล้วค่อยต่อยอดเป็น Project Management
- **Phase 3**: ทดสอบ Integration Testing ทุก Flow สำคัญ
- **Phase 4**: วัดประสิทธิภาพและวาง CI/CD Pipeline

ทุก Phase มีการ Review ก่อนขึ้น Phase ถัดไปครับ"

---

## 🖥️ Slide 4 — Phase 1: Requirements → Design

**บทพูด:**
"Phase แรกคือการ **แปลง Requirement เป็น Design** ครับ

จากความต้องการที่ว่า 'ต้องการระบบจัดการงานแบบ Role-Based'
เราตัดสินใจเชิงเทคนิคออกมาได้ 3 อย่างหลักคือ:

1. ใช้ **PostgreSQL** เพราะข้อมูลมี Relationship ซับซ้อน — งาน ต้องสัมพันธ์กับ โปรเจกต์ ที่สัมพันธ์กับ สมาชิก ที่มี Role ต่างกัน
2. ใช้ **Next.js App Router** เพราะแยก URL สาธารณะและส่วน Dashboard ออกจากกันได้ชัดเจน
3. ใช้ **JWT + Middleware** เพื่อให้ระบบความปลอดภัยอยู่ที่จุดเดียว ไม่กระจายอยู่ใน Controller ทุกตัว

การออกแบบก่อนเขียน Code ทำให้เราไม่ต้อง Refactor ใหญ่ในภายหลังครับ"

---

## 🖥️ Slide 5 — Phase 2: Build — ลำดับการสร้างระบบ

**บทพูด:**
"Phase สองคือการ Build ครับ เราเรียงลำดับเป็น Sprint

**Sprint 1** — Foundation: ต้องมี Database และ Auth ก่อน เพราะทุก Feature ที่เหลือต้องการสิ่งนี้
**Sprint 2** — Core: Project และ Task CRUD พร้อมระบบ RBAC ที่กำหนดสิทธิ์ Worker / Manager / Admin
**Sprint 3** — Collaboration: Comments, File Attach, Activity Log
**Sprint 4** — Polish: Analytics, Gantt Chart, Search

ทุก Sprint เราทำ 4 ขั้นตอนเสมอ: เขียน Code → ทดสอบด้วยมือ → Commit → Review
ไม่ข้ามขั้นตอนครับ เพราะถ้าข้ามแล้วรวม Sprint มันจะหา Bug ไม่เจอ"

> **[เปิด GitHub Repo]** โชว์ Commit History ให้เห็นว่า Commit มีหลายครั้งและมีชื่อ Commit ชัดเจน

---

## 🖥️ Slide 6 — Architecture Design

**บทพูด:**
"สถาปัตยกรรมที่เราเลือกยึดหลัก **Separation of Concerns** ครับ
คือแบ่งความรับผิดชอบให้ชัดเจนว่าอะไรทำหน้าที่อะไร

ฝั่ง **Frontend** (Next.js):
- Axios Interceptor คอยแนบ JWT Token ทุก Request โดยอัตโนมัติ ไม่ต้องเขียนซ้ำในทุก Function
- Middleware ของ Next.js ดัก Unauthorized Request ก่อนที่หน้าจะ Render

ฝั่ง **Backend** (Express):
- Controller แยกออกจาก Database Logic ผ่าน Prisma
- Middleware อยู่ตรงกลาง ตรวจสิทธิ์ก่อนถึง Controller ทุกครั้ง

ข้อดีที่สำคัญที่สุดคือ **ทดสอบได้** ครับ เพราะแต่ละส่วนแยกจากกัน เราสามารถ Mock Database ออกไปแล้วทดสอบ Controller โดดๆ ได้เลย"

---

## 🖥️ Slide 7 — Testing Strategy

> **หน้าจอ: เปิด Terminal เตรียมรัน Test**

**บทพูด:**
"เมื่อ Build เสร็จ สิ่งที่เราต้องทำคือ **พิสูจน์ว่ามันทำงานถูกต้อง** ครับ
เราเลือกแนวทาง **Black-box Integration Testing** คือทดสอบจากมุมมองผู้ใช้
ส่ง HTTP Request เข้าไป แล้วเช็คว่า Response ตรงตามที่ออกแบบไหม

เหตุผลที่ไม่เขียนแค่ Unit Test คือ Unit Test บอกได้แค่ว่า Function แต่ละตัวทำงานถูก
แต่ Integration Test บอกได้ว่า **ทั้งระบบเชื่อมกันถูกต้อง** ครับ

เครื่องมือที่ใช้:
- **Jest** สำหรับ Run Test และ Assert ผล
- **Supertest** จำลอง HTTP Request โดยไม่ต้องเปิด Server จริง
- **Manual Mock** แทน Prisma Client ทำให้ Test รันในเวลา 1 วินาที ไม่ต้องต่อ Database จริง"

---

## 🖥️ Slide 8 — Test Cases ที่ทดสอบ

**บทพูด:**
"เราทดสอบ 4 กลุ่มหลักครับ:

**Group 1 — Auth (9 cases):** รับสมัครใหม่ได้, ป้องกัน username ซ้ำ, Login ผิดรหัส Error 401
**Group 2 — Projects (8 cases):** Worker ทำไม่ได้ (403), Manager ทำได้, สิทธิ์ดูโปรเจกต์เฉพาะที่เป็นสมาชิก
**Group 3 — Tasks (6 cases):** State Machine ทำงานถูก — เปลี่ยนสถานะแล้ว timestamp บันทึกอัตโนมัติ
**Group 4 — Messaging (5 cases):** ส่งข้อความ, ดึงประวัติ, Read Receipt

รวม **29 Cases** ครับ ทั้งหมด Design มาจาก Business Requirement ที่เราวาง ไม่ได้เขียนมั่วๆ"

> **[รัน `npm test` ใน Terminal พร้อม Verbose Output]**

"เดี๋ยวรันให้ดูสดๆ เลยครับ..."

"จะเห็นว่า **29/29 PASS** และใช้เวลาเพียง ~1 วินาที เพราะ Mock ทำให้ไม่ต้องรอ Network ครับ"

---

## 🖥️ Slide 9 — Profiling: Measure ก่อน แก้ทีหลัง

**บทพูด:**
"หลังจาก Test ผ่านแล้ว ก็ไม่ได้หมายความว่าระบบ 'ดี' ครับ
มันแค่ 'ถูกต้อง' — แต่ยัง **อาจช้า, กินหน่วยความจำ, หรือมีช่องโหว่**

นี่คือเหตุผลที่เราทำ **Profiling** ครับ
หลักการง่ายมาก: _ต้องวัดก่อนเสมอ อย่าเดา_

เราทำ 2 แบบ:
- **Static Profiling** — วิเคราะห์โค้ด/Build ก่อน Runtime
- **Dynamic Profiling** — ดูพฤติกรรมจริงขณะโปรแกรมทำงาน"

---

## 🖥️ Slide 10 — Phase 3 vs Phase 4 Comparison

**บทพูด:**
"นี่คือผลเปรียบเทียบก่อน-หลัง Optimize ครับ

ฝั่ง **Static** (Build Analysis):
- Bundle ของหน้า Project Detail ลดลงจาก 13.4 → 6.66 kB  (**ลด 50%**)
  ด้วยการทำ Dynamic Import ของ Gantt Chart Component
- ปิดช่องโหว่ SSRF ใน Next.js ด้วยการอัปเกรด Version

ฝั่ง **Dynamic** (Runtime):
- API Response เฉลี่ยจาก ~50ms เหลือ 15–30ms — ด้วยการใช้ Async/Await อย่างถูกต้อง
- FPS ของ Gantt Chart: stable 60 FPS — ด้วย `useMemo` ไม่ Re-calculate ทุก Render
- ไม่พบ Memory Leak — ด้วยการ clean up `socket.off()` ทุกครั้งที่เปลี่ยนหน้า

ทุกตัวเลขมาจากการวัดจริง ไม่ใช่การคาดเดาครับ"

---

## 🖥️ Slide 11 — Optimization Actions

**บทพูด:**
"จากผล Profiling เราได้ทำการแก้ไข 2 กลุ่มครับ:

**Static Fix:**
- อัปเกรด Next.js → ปิดช่องโหว่ทันที
- ใช้ `dynamic()` ของ Next.js โหลด Component หนักๆ เฉพาะเมื่อต้องการ

**Dynamic Fix:**
- useMemo ครอบการคำนวณพิกัด Gantt ทั้งหมด → CPU ไม่ทำงานซ้ำโดยไม่จำเป็น
- Cleanup socket listener ทุก Unmount → ไม่มี Listener ค้างในหน่วยความจำ

หลักการที่ยึดมั่น: **ทุกการ Optimize ต้องมี Profiling Run ยืนยันก่อนและหลัง**
ไม่งั้นจะไม่รู้ว่าที่แก้ไปมันดีขึ้นจริงหรือเปล่าครับ"

---

## 🖥️ Slide 12 — CI/CD Pipeline

> **[เปิดหน้า GitHub แท็บ Actions]**

**บทพูด:**
"ถัดมาคือส่วนที่ทำให้ทุกกระบวนการที่พูดไปเกิดขึ้น **อัตโนมัติ** ครับ

ทุกครั้งที่มีการ Push Code ขึ้น GitHub Actions จะทำงาน 2 Job พร้อมกัน:

**Job 1 — Backend Testing:**
```
git checkout → npm ci → prisma generate → npm test
```
ถ้าไม่ครบ 29/29 → Pipeline ล้มเหลว Block ทันที

**Job 2 — Frontend Build Check:**
```
git checkout → npm ci → npm run build
```
ถ้า Build ไม่ผ่านหรือมี Type Error → Block เช่นกัน

สองงานรัน **Parallel** ครับ ประหยัดเวลาประมาณ 50%
นี่คือสิ่งที่บริษัท Tech ระดับโลกใช้เพื่อให้มั่นใจว่า
ไม่มีโค้ดที่พังถูก Merge เข้าไปโดยไม่รู้ตัวครับ"

> **[คลิกดู Workflow Run ล่าสุด โชว์ Checkmark สีเขียวทุก Step]**

---

## 🖥️ Slide 13 — ทำไม CI/CD ถึงสำคัญ?

**บทพูด:**
"ผมอยากอธิบายว่า CI/CD แก้ปัญหาจริงอะไรบ้างครับ

ปัญหาที่ 1: _'ในเครื่องผมใช้ได้แต่บน Server พัง'_ — CI รันใน Environment มาตรฐานทุกครั้ง ไม่พึ่งเครื่องใครคนเดียว

ปัญหาที่ 2: _'ลืมรัน Test ก่อน Push'_ — Pipeline บังคับรันให้เสมอ

ปัญหาที่ 3: _'Bundle Size พุ่งโดยไม่รู้ตัว'_ — CD Build Job แจ้งเตือนทันที

สรุปว่า CI/CD คือ **Safety Net ของทีม** ครับ ทำให้ Developer แต่ละคน
แก้โค้ดได้อย่างมั่นใจ รู้ว่ามีระบบคอยตรวจแทนตลอดเวลา"

---

## 🖥️ Slide 14 — Known Issues & Backlog

**บทพูด:**
"ก่อนจะ Demo ผมอยากพูดถึงสิ่งที่ยังไม่สมบูรณ์ด้วยครับ
เพราะการยอมรับ Known Issue คือหนึ่งในทักษะสำคัญของวิศวกรซอฟต์แวร์

เราพบ 4 ปัญหาหลัก และประเมินผลกระทบแล้ว:
1. **Timezone Shift บน Gantt** — Low Impact แก้ได้ด้วย date-fns UTC parser
2. **Dark Mode Flash** — Low UX Impact แก้ด้วย inline script บน `<head>`
3. **Socket Room ไม่ update Live** — Medium แก้ด้วย emit แจ้ง Client join room ใหม่
4. **Orphan Files บน Server** — Medium แก้ด้วย fs.unlink เมื่อ Delete Record

ทั้งหมดถูก Prioritize ไว้ใน Backlog เรียบร้อยแล้วครับ ไม่ได้ทิ้งไว้โดยไม่รู้"

---

## 🖥️ Slide 15 — Summary

> **[ปิดสไลด์ เปิด Browser ไปหน้าเว็บจริง]**

**บทพูด:**
"สรุปนะครับ Shark Task เดินตามกระบวนการ Software Engineering ครบทุกขั้น:

**Requirements → Design → Build → Test → Profile → Automate**

ตัวเลขที่พิสูจน์คุณภาพ:
- 29/29 Tests Passed, Coverage 83.6%
- Bundle 6.66 kB/page, API 15–30ms, FPS 60
- CI/CD Pipeline Green ทุก Push

ตอนนี้ขอเปิด Demo ให้ดูการทำงานจริงของเว็บครับ..."

---

## 🌐 ช่วง Demo (เปิดเว็บ)

> เปิดเว็บ Demo จริง

**ลำดับการ Demo:**
1. **Login** → โชว์ว่า JWT ทำงาน, Redirect ไป Dashboard
2. **Dashboard** → โชว์ Analytics (% Completion, Task Distribution)
3. **Project → Gantt** → เลื่อน Timeline ให้เห็น 60 FPS (ผล Dynamic Profiling)
4. **Task Detail** → เปลี่ยนสถานะ Open → In Progress → โชว์ว่า `started_at` บันทึกอัตโนมัติ (ผลของ Test CL-03)
5. **Inbox** → โชว์ Activity Log ที่บันทึกทุก Event

**บทพูดระหว่าง Demo:**
"ทุกสิ่งที่เห็นอยู่บนหน้าจอนี้ผ่านการทดสอบจาก Test Case ที่ผมโชว์ไปครับ
ไม่ใช่แค่ทำงานได้ แต่ทำงาน 'ถูกต้อง' ตาม Spec ที่ออกแบบไว้ตั้งแต่ Phase 1"

---

## ❓ เตรียมตอบคำถามอาจารย์

**Q: ทำไมเลือก Integration Test ไม่ใช่ Unit Test?**
A: "Unit Test ดีสำหรับ Pure Function แต่ระบบเรามี Business Logic ที่ขึ้นอยู่กับหลาย Layer ร่วมกัน Integration Test จึงสะท้อนการใช้งานจริงได้ดีกว่า และ Mock Database ทำให้ยังรวดเร็วอยู่ครับ"

**Q: Profiling ทำยังไง? ใช้ Tool อะไร?**
A: "Static ใช้ npm run build ของ Next.js ที่ Output Bundle Size ให้อัตโนมัติครับ Dynamic ใช้ Chrome DevTools → Performance Tab → Record แล้วดู Flame Graph และ FPS ครับ"

**Q: ถ้ามีเวลาเพิ่ม จะทำอะไรก่อน?**
A: "อันดับ 1 คือแก้ Token Expiry ให้ Auto-redirect ไป Login แทนที่จะแสดง Error ดิบๆ ครับ เพราะ UX Impact สูงและแก้ไขไม่ยาก"

**Q: Coverage 83.6% พอหรือเปล่า?**
A: "ในอุตสาหกรรม เกณฑ์มาตรฐานอยู่ที่ 80% ครับ เราผ่านและเน้นทดสอบส่วนที่มี Business Risk สูงก่อน เช่น RBAC และ State Machine ส่วนที่ไม่ครอบคลุมคือ Edge Case ที่ Impact น้อยกว่าครับ"
