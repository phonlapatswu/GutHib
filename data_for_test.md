# 🦈 ข้อมูลบัญชีจำลอง (Mock Data for Testing)

นี่คือรายการบัญชีสำหรับใช้ทดสอบระบบตามที่คุณขอไว้ครับ (โดยมีทั้งสิทธิ์แบบผู้ดูภาพรวมงาน และคนทำงาน)

## 👑 1. บัญชีหัวหน้าทีม (Team Leader / Requester)
ผู้มีสิทธิ์สำหรับสร้างโปรเจกต์ (Project), กระจายงาน (Assign Task), และให้คะแนนหรือ Review งาน

- **Username:** `shark_leader`
- **Email:** `leader@sharktask.com`
- **Password:** `Admin1234!`
- **Role:** `Requester`
- **รายละเอียด:** เอาไว้ใช้ล็อกอินและทดลองสร้างงานลงไปในระบบ

## 🐠 2. บัญชีพนักงาน (Regular User / Worker)
ผู้มีสิทธิ์ในการรับงาน (Claim), อัปเดตสถานะงาน, และทำการส่งงาน (Submit)

- **Username:** `worker_fish`
- **Email:** `worker@sharktask.com`
- **Password:** `Worker1234!`
- **Role:** `Worker`
- **รายละเอียด:** เอาไว้ล็อกอินและทดสอบตีเนียนเป็นลูกน้องเพื่อทดลองส่งงาน 

---

### 💡 (โบนัส) คำสั่ง SQL สำหรับเพิ่มผู้ใช้ลงฐานข้อมูล
เผื่อในอนาคตคุณอยากเอาเข้าไปใส่ใน Database เลย สามารถก๊อปคำสั่งนี้ไปรันใน Postgres.app ได้ครับ (รหัสผ่านตอนนี้ยังเป็นตัวอักษรธรรมดา เดี๋ยวตอนเราเขียน API ระบบล็อกอิน เราค่อยใช้คำสั่ง Hash รหัสผ่านอีกทีครับ):

```sql
INSERT INTO users (username, password_hash, email, role, created_at)
VALUES 
  ('shark_leader', 'Admin1234!', 'leader@sharktask.com', 'Requester', NOW()),
  ('worker_fish', 'Worker1234!', 'worker@sharktask.com', 'Worker', NOW());
```
