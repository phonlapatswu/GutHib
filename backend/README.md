# Shark Task - Backend API

นี่คือส่วนของ Backend สำหรับโปรเจกต์ **Shark Task ("GitHub for Everyone")** 🦈

## สิ่งที่ต้องมีก่อนเริ่มต้น (Prerequisites)
- ติดตั้ง Node.js ไว้ในเครื่อง
- มีฐานข้อมูล PostgreSQL ที่กำลังทำงานอยู่ (หรือใช้บริการฟรีอย่าง Prisma Postgres)

## วิธีการตั้งค่าและรันโปรเจกต์ (Setup & Run)

1. **ติดตั้ง Dependencies** (ติดตั้งเรียบร้อยแล้ว แต่เขียนไว้เป็นข้อมูลเบื้องต้น):
   ```bash
   npm install
   ```

2. **การตั้งค่าฐานข้อมูล (Database Configuration)**:
   - ตรวจสอบไฟล์ `.env` และแก้ไขค่า `DATABASE_URL` ให้ตรงกับ PostgreSQL ของคุณ
   - ตัวอย่างรูปแบบ `DATABASE_URL`:
     `DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"`
   - หมายเหตุ: หากใช้ Prisma 7+ ข้อมูลการเชื่อมต่อบางส่วนอาจจะอยู่ที่ไฟล์ `prisma.config.ts`

3. **สร้างตารางในฐานข้อมูล (Migration)**:
   เมื่อตั้งค่าการเชื่อมต่อฐานข้อมูลเสร็จแล้ว ให้สร้างตารางตาม Schema ที่ออกแบบไว้ด้วยคำสั่ง:
   ```bash
   npx prisma db push
   # หรือสำหรับโหมด Production: npx prisma migrate dev --name init
   ```

4. **เปิดใช้งาน Server (Start the Server)**:
   คุณสามารถรันโปรเจกต์ทั้งฝั่ง Backend และ Frontend พร้อมกันได้ โดยเข้าไปที่โฟลเดอร์หลักของโปรเจกต์ (`/Users/phonlapatphetsinthop/Desktop/SharkTask`) และพิมพ์:
   ```bash
   npm run dev
   ```
   *หรือถ้ารันเฉพาะ Backend ในโฟลเดอร์นี้ ให้ใช้ `npm run dev` เช่นกัน เซิร์ฟเวอร์จะเปิดใช้งานที่ `http://localhost:3001`*

---

## การทดสอบ API เส้นแรก

เราได้สร้าง RESTful API ไว้สำหรับดึงข้อมูล **Task Tree View** (โครงสร้างงานแบบ Parent-Child)

**Endpoint:** `GET /api/projects/:project_id/tasks`

### วิธีการทดสอบ:
1. เนื่องจากฐานข้อมูลยังว่างเปล่า คุณต้องเพิ่มข้อมูล `Project` และ `Tasks` เข้าไปก่อน สามารถใช้ Prisma Studio (เครื่องมือจัดการ Database แบบ GUI) ได้โดยพิมพ์:
   ```bash
   npx prisma studio
   ```
2. ใน Prisma Studio:
   - สร้างข้อมูล `User`
   - สร้างข้อมูล `Project` และกำหนดเจ้าของ (Owner) ให้เป็น User ที่เพิ่งสร้าง
   - สร้างข้อมูล `Task` ภายใต้ Project ดังกล่าว (เพื่อทดสอบการดึงข้อมูลแบบ Tree ให้ตั้งค่า `parent_task_id` ของงานย่อยให้ชี้ไปที่ `task_id` ของงานหลัก)

3. **เรียกใช้งาน API**:
   ใช้เครื่องมือเช่น `curl`, Postman หรือเปิดผ่าน Browser ได้เลย:
   ```bash
   curl http://localhost:3001/api/projects/ใส่_PROJECT_ID_ของคุณที่นี่/tasks
   ```
   *อย่าลืมเปลี่ยนข้อความตรง `ใส่_PROJECT_ID_ของคุณที่นี่` ให้เป็น ID จริงจากฐานข้อมูล*

### ผลลัพธ์ที่คาดหวัง (Expected Result)
API จะส่งข้อมูลกลับมาเป็นรูปแบบ JSON Array โดยแสดงหน้าต่างของงานหลัก (Root Tasks) และในแต่ละงานจะมี Property ชื่อ `sub_tasks` ซึ่งเป็น Array เก็บข้อมูลงานย่อยที่อยู่ซ้อนอยู่ข้างใน!
