# 🦈 คู่มือการรันโปรเจกต์ Shark Task (Full-Stack) แบบ 100%

เนื่องจากระบบนี้ประกอบด้วย **Frontend (Next.js)** และ **Backend (Node.js/Prisma/PostgreSQL)** นี่คือขั้นตอนทั้งหมดตั้งแต่ศูนย์เพื่อให้คุณเปิดใช้งานเว็บนี้ได้สำเร็จครับ

---

## ขั้นตอนที่ 1: เตรียมโปรแกรมสำหรับฐานข้อมูล (PostgreSQL)
โปรเจกต์นี้ใช้ PostgreSQL เป็นฐานข้อมูลหลัก ดังนั้นคุณต้องมีตัวรันฐานข้อมูลในเครื่องก่อน
- 🍏 **สำหรับ Mac**: แนะนำให้ดาวน์โหลดและติดตั้งแอป **[Postgres.app](https://postgresapp.com/)** (กดโหลด > ลากเข้า Applications > เปิดแอปและกดปุ่ม "Start") เมื่อแอปทำงานแล้วสามารถเปิด Terminal พิมพ์คำสั่ง `createdb sharktask` ได้เลย
- 🪟 **สำหรับ Windows**: แนะนำให้ดาวน์โหลดตัวติดตั้งจาก **[PostgreSQL Official](https://www.postgresql.org/download/windows/)** (ตอนติดตั้งให้จำรหัสผ่านที่ตั้งเอาไว้ให้ดีดัวย) จากนั้นเปิดโปรแกรม pgAdmin 4 ที่แถมมาด้วย > คลิกขวาที่ Databases > Create > Database... > ตั้งชื่อว่า `sharktask`

## ขั้นตอนที่ 2: ตั้งค่าไฟล์ .env (เชื่อมต่อ Database)
1. เปิดไฟล์ `/backend/.env` 
2. แก้ไขบรรทัดล่างสุด (`DATABASE_URL`) ให้ชี้ไปที่ฐานข้อมูลของคุณ 
   - 🍏 **สำหรับ Mac (ที่ใช้ Postgres.app):** ส่วนใหญ่เสียบแล้วใช้ได้เลย
     ```env
     DATABASE_URL="postgresql://localhost:5432/sharktask?schema=public"
     ```
   - 🪟 **สำหรับ Windows (หรือใช้ Docker / มีการตั้งรหัสผ่าน):** ต้องใส่ Username (ค่าเริ่มต้นมักเป็น `postgres`) และรหัสผ่านของคุณด้วย
     ```env
     DATABASE_URL="postgresql://postgres:รหัสผ่านของคุณ@localhost:5432/sharktask?schema=public"
     ```

## ขั้นตอนที่ 3: ติดตั้ง Dependencies ทั้งระบบ 
1. เปิดแอพพลิเคชั่น Terminal 
2. เข้าไปที่โฟลเดอร์หลักของโปรเจกต์:
   ```bash
   cd /Users/phonlapatphetsinthop/Desktop/SharkTask
   ```
3. รันคำสั่งนี้เพียง **ครั้งเดียว** เพื่อติดตั้ง Package ทั้งหมดของโหนด (Node.js) ทั้งหน้าบ้านและหลังบ้าน:
   ```bash
   npm run install:all
   ```

## ขั้นตอนที่ 4: สร้างตารางในฐานข้อมูล (Migration)
ก่อนเซิร์ฟเวอร์จะเรียกข้อมูลได้ เราต้องสร้างโครงสร้างตารางก่อน
1. เข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. รันคำสั่งเพื่อสร้างตาราง (อิงจาก prisma/schema.prisma):
   ```bash
   npx prisma db push
   ```
   *(รอจนขึ้นแถบสีเขียวว่าตารางถูกสร้างเรียบร้อย)*

## ขั้นตอนที่ 5: เริ่มต้นใช้งานจริง (Start the System!)
1. กลับออกมาที่โฟลเดอร์หลักของโปรเจกต์:
   ```bash
   cd /Users/phonlapatphetsinthop/Desktop/SharkTask
   ```
2. สั่งเปิดทั้งเซิร์ฟเวอร์ Backend และ Frontend หน้าเว็บขึ้นมาพร้อมกันด้วยคำสั่ง:
   ```bash
   npm run dev
   ```

## ขั้นตอนที่ 6: เข้าดูผลลัพธ์ผ่านบราวเซอร์
- 🚀 **ตัวหน้าเว็บหลัก (Frontend)**: เปิดดูได้ที่ [http://localhost:3000](http://localhost:3000)
- ⚙️ **ฝั่งเซิร์ฟเวอร์ (API Backend)**: จะรันอยู่ที่ `http://localhost:3001` (ไม่ต้องเปิดในเบราว์เซอร์ เว้นแต่ต้องการทดลองยิง API เฉยๆ)

---

### โบนัส: การเพิ่มข้อมูลจำลอง
เพื่อให้เห็นหน้าตาเหมือนใน UI จำเป็นต้องมีข้อมูลในฐานข้อมูล (เนื่องจาก Dashboard จะดึงจาก Database)
- คุณสามารถเปิดแท็บ Terminal ใหม่อีกอัน แล้วพิมพ์:
  ```bash
  cd /Users/phonlapatphetsinthop/Desktop/SharkTask/backend
  npx prisma studio
  ```
- ซึ่งจะเด้งหน้าต่างขึ้นมาที่ `http://localhost:5555` ให้คุณกด Add ข้อมูลใส่ลงในตาราง `User`, `Project`, และ `Task` แบบง่ายๆ เหมือนป้อนข้อมูลใส่ Excel ได้เลยครับ!
