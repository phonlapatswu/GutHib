# 🦈 Shark Task: การจัดการโปรเจกต์ที่ "คม" กว่าที่เคย

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.dot_io&logoColor=white)

**Shark Task** คือแพลตฟอร์มบริหารจัดการงานยุคใหม่ที่เน้นความรวดเร็ว แม่นยำ และทรงพลัง เราออกแบบระบบมาภายใต้แนวคิด "GitHub สำหรับทุกคน" เพื่อมอบเครื่องมือระดับสูงให้แก่คนทำงานทุกสายอาชีพผ่านอินเตอร์เฟสที่ทันสมัยและใช้งานง่ายที่สุด

---

## ⚡ วิสัยทัศน์ของเรา
เครื่องมือจัดการโปรเจกต์ส่วนใหญ่มักจะเรียบง่ายเกินไปหรือซับซ้อนจนใช้งานยาก **Shark Task** จึงถูกสร้างมาเพื่อหาจุดสมดุลนั้น ด้วยดีไซน์ที่เฉียบคมและระบบการแสดงผลข้อมูลแบบเรียลไทม์ คุณจะไม่ต้องจมอยู่กับตาราง Excel ที่น่าเบื่ออีกต่อไป แต่จะเห็น "จังหวะหัวใจ" ของโปรเจกต์คุณได้ทันที

## 🏗️ โครงสร้างภายใน (Architecture)
เราใช้สถาปัตยกรรม Full-Stack TypeScript ที่แยกส่วนกันอย่างชัดเจน:

- **ส่วนสมอง (Backend)**: ขับเคลื่อนด้วย Node.js & Express พร้อมระบบ Prisma ORM และฐานข้อมูล PostgreSQL จัดการการซิงค์ข้อมูลแบบวินาทีต่อวินาทีผ่าน Socket.io
- **ส่วนหน้าตา (Frontend)**: พัฒนาด้วย Next.js 14 (App Router) ตกแต่งด้วย Vanilla CSS เพื่อความพรีเมียมและลื่นไหลสูงสุด

## 🚀 ฟีเจอร์เด่นที่ "กัด" ไม่ปล่อย
- **ไทม์ไลน์ (Gantt Chart)**: ระบบ Interactive Gantt ที่เราเขียนขึ้นเอง ช่วยให้เห็นภาพรวมของเวลาและงานที่ทับซ้อนกัน โดยปรับแต่งให้โหลดเร็วขึ้นกว่าปกติถึง 50%
- **คัมบังบอร์ด (Kanban)**: จัดการสถานะงานได้แบบลากวาง พร้อมอัปเดตสถานะให้เพื่อนร่วมทีมเห็นทันทีโดยไม่ต้องกดรีเฟรช
- **แชทสดในโปรเจกต์ (Live Messaging)**: ห้องแชทเฉพาะสำหรับแต่ละโปรเจกต์ เพื่อให้การสื่อสารเกิดขึ้นในที่ที่งานอยู่จริงๆ
- **ข้อมูลวิเคราะห์ (Analytics)**: วัดผลประสิทธิภาพการทำงานของสมาชิกในทีม ติดตามอัตราการปิดงานและความเคลื่อนไหวล่าสุด

---

## 🛠️ การเริ่มต้นใช้งานแบบด่วน

### 1. เตรียมฐานข้อมูล
ตรวจสอบให้แน่ใจว่าคุณมี PostgreSQL รันอยู่ในชื่อ `sharktask`
- **Mac**: แนะนำให้ใช้ `Postgres.app`
- **Windows**: ติดตั้ง PostgreSQL และสร้าง Database ผ่าน pgAdmin

### 2. ตั้งค่าระบบ
แก้ไขไฟล์ `/backend/.env` เพื่อเชื่อมต่อข้อมูล:
```env
DATABASE_URL="postgresql://localhost:5432/sharktask?schema=public"
JWT_SECRET="shark_secret_key"
```

### 3. รันระบบ (Ignition)
จากโฟลเดอร์หลักของโปรเจกต์:
```bash
# ติดตั้ง Library ทั้งหมด (หน้าบ้าน + หลังบ้าน)
npm run install:all

# ซิงค์โครงสร้างฐานข้อมูล
cd backend && npx prisma db push && cd ..

# เริ่มทำงาน!
npm run dev
```

เข้าใช้งานได้ที่ [http://localhost:3000](http://localhost:3000)
.
---

## 📈 มาตรฐานวิศวกรรม (Engineering Standards)
Shark Task ไม่ได้ถูกสร้างมาแค่ให้ "รันได้" แต่ถูกสร้างมาด้วยมาตรฐานสูงสุด:
- **CI/CD Ready**: รองรับระบบ Pipeline อัตโนมัติผ่าน GitHub Actions
- **High Coverage**: โครงสร้างข้อมูลหลักถูกคุ้มครองด้วย Unit Test ที่ครอบคลุมกว่า 80%
- **Optimized**: ใช้เทคนิค Dynamic Code Splitting และบีบอัดรูปภาพอัตโนมัติ เพื่อการตอบสนองที่เร็วกว่า 200ms

---

*“รวดเร็ว. เฉียบคม. ชัดเจน.” — ทีมพัฒนา Shark Task*
