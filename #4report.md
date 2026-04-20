# Shark Task: UI Test Case Report

รายงานฉบับนี้รวบรวมกรณีการทดสอบส่วนติดต่อผู้ใช้ (UI Test Cases) สำหรับฟีเจอร์หลักของระบบ เพื่อตรวจสอบความถูกต้องของการแสดงผลและการตอบสนองต่อการใช้งานของผู้ใช้

---

## 1. ตารางกรณีการทดสอบ UI (UI Test Cases Table)

| ID | UI Scenario | Steps / Interaction | Expected Results (ค่าที่ตรวจสอบ) |
|:---|:---|:---|:---|
| UI-01 | **Login Workflow** | 1. ไปที่หน้า `/login`<br>2. กรอก Username และ Password ที่ถูกต้อง<br>3. กดปุ่ม "Login" | 1. URL ต้องเปลี่ยนเป็น `/` (Dashboard)<br>2. ต้องพบชื่อผู้ใช้หรือรูป Avatar แสดงที่ Sidebar<br>3. มีการเก็บ Cookie 'token' ใน Browser |
| UI-02 | **Task Creation Modal** | 1. เข้าหน้าโปรเจกต์<br>2. กดปุ่ม "New Task"<br>3. กรอกชื่อสีงานและเลือกวันที่<br>4. กด "Create Task" | 1. Modal ต้องปิดตัวลงโดยอัตโนมัติ<br>2. Task ใหม่ต้องปรากฏในรายการ (List) ทันที<br>3. มีข้อความแจ้งเตือน "Task created successfully" (ถ้ามี) |
| UI-03 | **Timeline View Toggle** | 1. อยู่ในหน้ารายละเอียดโปรเจกต์<br>2. กดที่เมนูแท็บ "Timeline" | 1. ส่วนแสดงผล List งานต้องหายไป<br>2. คอมโพเนนต์ Gantt Chart ต้องปรากฏขึ้น<br>3. ต้องเห็นแถบสีแสดงตามช่วงเวลาที่ระบุไว้ในงาน |
| UI-04 | **Dark Mode Persistence** | 1. กดปุ่มไอคอนดวงจันทร์ (Moon) ที่ด้านล่าง Sidebar<br>2. ทำการ Refresh หน้าจอ | 1. แท็ก `<html>` ต้องมีคลาส `dark`<br>2. สีพื้นหลังต้องเปลี่ยนเป็นโทนมืดตาม CSS Variables<br>3. หลัง Refresh สถานะต้องยังเป็น Dark Mode อยู่ |
| UI-05 | **Real-time Chat Update** | 1. เข้าหน้า "/message"<br>2. เลือกโปรเจกต์<br>3. พิมพ์ข้อความและกดส่ง | 1. ข้อความต้องปรากฏในรายการแชทฝั่งขวาทันที<br>2. ช่อง Input ต้องถูกล้างค่าให้ว่าง (Clear)<br>3. รายการแชทต้อง Scroll ลงไปที่ข้อความล่าสุดโดยอัตโนมัติ |

---

## 2. ขั้นตอนการทดสอบเชิงสังเกต (Observational Steps)

สำหรับการทดสอบ UI ควรทำการตรวจสอบองค์ประกอบเพิ่มเติมดังนี้:
1.  **Layout Reponsiveness**: ตรวจสอบว่า Sidebar ยุบแอป (Toggle) ได้ถูกต้องเมื่อใช้หน้าจอมือถือ
2.  **Loading States**: ตรวจสอบว่ามีไอคอน Loader2 หมุนแสดงผลระหว่างที่รอข้อมูลจาก API
3.  **Empty States**: เมื่อไม่มีงานในโปรเจกต์ ต้องแสดงข้อความ "No tasks yet" พร้อมดีไซน์ที่สวยงาม

---

## 3. รายงานเปรียบเทียบผลการ Profiling (Optimization Comparison)

รายงานนี้เปรียบเทียบประสิทธิภาพและความปลอดภัยของระบบก่อนและหลังการทำ Optimization เพื่อแสดงให้เห็นถึงความเปลี่ยนแปลงที่เกิดขึ้นจริง

### 3.1 ตารางเปรียบเทียบผลลัพธ์ (Comparison Table)

| รายการทดสอบ | ก่อนปรับปรุง (#3report) | หลังปรับปรุง (#4report) | ผลลัพธ์ (Improvement) |
|:---|:---|:---|:---|
| **ช่องโหว่ระดับ Critical** | 1 รายการ (SSRF) | **0 รายการ** | **✅ แก้ไขสำเร็จ 100%** |
| **เวลาในการ Build** | ~11.0 วินาที | **~9.45 วินาที** | **⚡ เร็วขึ้น 14%** |
| **ขนาด JS (Project Page)** | 13.4 KB | **6.66 KB** | **📉 ลดลง 50%** |
| **Shared JS Bundle** | 84.3 KB | 87.4 KB | เพิ่มขึ้นเล็กน้อย (Image Config) |
| **DB Query Speed** | ปกติ | **รวดเร็วขึ้นเป็นพิเศษ** | ด้วย Index บน Start/Due Date |

### 3.2 สิ่งที่ดำเนินการเพื่อให้ผลดีขึ้น (What we did?)

เราได้ดำเนินมาตรการ "ยกระดับ" ระบบใน 4 ด้านหลัก ดังนี้:

1.  **🛡️ Security Hardening (Static)**: อัปเกรดแพ็คเกจ `next` จากเวอร์ชัน 14.1.0 เป็น **14.2.35+** ซึ่งเป็นการอุดช่องโหว่ความปลอดภัยระดับรุนแรง (Critical) ที่เกี่ยวข้องกับ Server-Side Request Forgery และ Cache Poisoning ทำให้ระบบมีความน่าเชื่อถือสูงขึ้น
2.  **⚡ Code Splitting (Dynamic)**: เปลี่ยนการนำเข้าคอมโพเนนต์ `GanttTimeline` จากแบบ Static มาเป็น **Dynamic Import** (`next/dynamic`) โดยตั้งค่าให้โหลดเฉพาะเมื่อต้องการใช้ (Lazy Loading) ส่งผลให้ขนาดไฟล์ JS เริ่มต้นของหน้าโปรเจกต์ลดลงเหลือเพียงครึ่งเดียว
3.  **📸 Image Optimization**: เปลี่ยนมาใช้คอมโพเนนต์ `<Image />` จาก Next.js แทนแท็ก `<img>` เดิมในส่วนของรูปโปรไฟล์ ช่วยให้ไฟล์รูปภาพถูกบีบอัดเป็นฟอร์แมต WebP โดยอัตโนมัติและจัดการเรื่องขนาดรูปให้เหมาะสมกับหน้าจอ
4.  **🗄️ Database Indexing**: เพิ่ม **Database Indexes** ในไฟล์ `schema.prisma` สำหรับฟิลด์วันที่ (`planned_start_date`, `due_date`) เพื่อให้การค้นหาและดึงข้อมูลงานมาแสดงในไทม์ไลน์ทำได้รวดเร็วที่สุดแม้โปรเจกต์จะมีขนาดใหญ่

> [!TIP]

---

## 4. รายงานโครงสร้าง CI/CD (CI/CD Pipeline Report)

เพื่อให้การพัฒนา Shark Task เป็นไปอย่างมีมาตรฐานและลดข้อผิดพลาดก่อนถึงมือผู้ใช้ เราได้นำระบบ **CI/CD (Continuous Integration / Continuous Deployment)** มาใช้เพื่อทำกระบวนการทดสอบและติดตั้งอัตโนมัติ

### 4.1 แนวคิดการทำงาน (CI/CD Concept)
1.  **Continuous Integration (CI)**: เมื่อมีการ Push โค้ดใหม่เข้าไปใน GitHub ระบบจะทำการรัน Pipeline อัตโนมัติเพื่อตรวจสอบความถูกต้อง (Linting, Type Check, และ Unit Testing)
2.  **Continuous Deployment (CD)**: หากขั้นตอนการ CI ผ่านทั้งหมด โค้ดจะถูกส่งไป Build เป็น Production และติดตั้งลงบน Cloud Server ทันที

### 4.2 ระบบที่ใช้ (Tooling)
เราเลือกใช้ **GitHub Actions** เนื่องจากรองรับการรันงานแบบขนาน (**Parallel Jobs**) ในระดับ **Free Tier** (2,000 นาที/เดือน) ซึ่งเพียงพอสำหรับโปรเจกต์ขนาดเล็กถึงกลาง

### 4.3 Script สำหรับ CI Pipeline (Parallel Jobs)

ด้านล่างนี้คือไฟล์คอนฟิกตัวอย่างสำหรับ GitHub Actions ที่แยกการทำงานของ Backend และ Frontend ให้รันพร้อมกัน (Parallel) เพื่อความรวดเร็ว:

```yaml
name: SharkTask CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # Job ที่ 1: ตรวจสอบ Backend (รันขนาน)
  backend-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install & Test Backend
        run: |
          cd backend
          npm install
          npm test

  # Job ที่ 2: ตรวจสอบ Frontend (รันขนานกับ Backend)
  frontend-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install & Build Frontend
        run: |
          cd frontend
          npm install
          npm run build

  # Job ที่ 3: การรวบรวมและแจ้งเตือน (รันหลังจาก Job 1 และ 2 เสร็จ)
  deploy-readiness:
    needs: [backend-validation, frontend-validation]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deployment Trigger
        run: echo "System is stable. Ready for production deployment!"
```

### 4.4 ข้อดีของการใช้ Parallel Job ใน Free Tier
- **ลดเวลาการรอ (Wait Time)**: แทนที่จะต้องรอให้ Backend เทสเสร็จก่อนแล้วค่อยเริ่ม Frontend ระบบจะรันทั้งคู่ไปพร้อมกัน ทำให้ประหยัดเวลาลงกว่า 40-50%
- **Isolate Failure**: หาก Backend พังแต่ Frontend ผ่าน เราจะรู้ได้ทันทีว่าปัญหาอยู่ที่จุดไหนโดยไม่ต้องรอขั้นตอนอื่น
- **Efficiency**: ใช้ทรัพยากรของ GitHub ได้อย่างเต็มประสิทธิภาพโดยไม่มีค่าใช้จ่ายเพิ่มในแพ็คเกจเริ่มต้น

---

## 5. กระบวนการวิศวกรรมซอฟต์แวร์ (Software Engineering Methodology)

ในโปรเจกต์ **Shark Task** นี้ เราได้ประยุกต์ใช้หลักการทางวิศวกรรมซอฟต์แวร์ (Software Engineering) เพื่อให้การพัฒนามีประสิทธิภาพ มีคุณภาพ และสามารถตรวจสอบได้จริง ดังนี้:

### 5.1 รูปแบบการทำงาน (Development Methodology)
เราพัฒนารูปแบบ **Agile Methodology** ผสมผสานกับ **Kanban** เพื่อความคล่องตัว:
- **Iterative & Incremental**: แบ่งการทำงานออกเป็นรอบสั้นๆ (Iterations) โดยเริ่มจากแกนหลัก (Core) เช่น Auth และ Database แล้วค่อยขยายไปยังฟีเจอร์ที่ซับซ้อนอย่าง Gantt Chart และ Analytics
- **Kanban Board**: ใช้ไฟล์ `KANBAN.md` และ `task.md` ในการบริหารจัดการสถานะงาน (To-do, In Progress, Completed) เพื่อให้เห็นภาพรวมของงานที่ค้างอยู่และความคืบหน้าของโครงการ

### 5.2 การตรวจสอบและเฝ้าระวังระบบ (Build & Performance Monitoring)
เราให้ความสำคัญกับการตรวจสอบคุณภาพโค้ดอย่างสม่ำเสมอ:
- **Continuous Monitoring**: ทุกครั้งที่มีการแก้ไขฟีเจอร์สำคัญ เราจะทำการรัน `npm run build` เพื่อตรวจสอบว่าโค้ดไม่มี Error ร้ายแรง และพร้อมสำหรับการ Deploy
- **Profiling Integration**: ใช้ทั้ง Static Profiling (Security Audit) เพื่อดักจับช่องโหว่ และ Dynamic Profiling เพื่อวัดความเร็วและขนาด Bundle ทำให้เราตัดสินใจทำ Optimization (เช่น Dynamic Import) ได้ถูกต้องตามหลักข้อมูล (Data-Driven)

### 5.3 การบริหารจัดการข้อผิดพลาด (Bug & Issue Management)
เราใช้กระบวนการทางวิศวกรรมในการจัดการ Bug:
- **Bug Reporting**: เมื่อตรวจพบ Bug จะมีการบันทึกอาการ (Symptom), สาเหตุ (Root Cause) และผลกระทบ (Impact) ลงในรายงาน (#3report Section 8) เพื่อใช้เป็น Backlog ในการพัฒนาต่อ
- **Unit Testing**: ใช้เฟรมเวิร์กการทดสอบอัตโนมัติเพื่อป้องกัน **Regression Bugs** (ข้อผิดพลาดเดิมที่อาจกลับมาหลังแก้โค้ดใหม่) โดยเน้นความครอบคลุม (Coverage) มากกว่า 80%

### 5.4 หลักการ SE ที่นำมาประยุกต์ใช้ (Applied SE Principles)
1.  **Separation of Concerns (SoC)**: แยกส่วนการทำงานชัดเจนระหว่าง Backend API และ Frontend UI เพื่อให้ง่ายต่อการแก้ไขและดูแลรักษา
2.  **Modular Architecture**: ออกแบบคอมโพเนนต์ให้มีความเป็นอิสระ (เช่น `GanttTimeline`) เพื่อให้สามารถนำไป Reuse หรือเปลี่ยนตรรกะภายในได้โดยไม่กระทบส่วนอื่น
3.  **Type Safety (TypeScript)**: ใช้ TypeScript ในการกำหนด Schema และ Interfaces เพื่อลดความผิดพลาดในการส่งต่อข้อมูลระหว่างคอมโพเนนต์
4.  **Performance Budgets**: มีการตั้งเป้าหมายเรื่องขนาดไฟล์ (Bundle Size) และเวลาการตอบสนอง เพื่อรักษาประสบการณ์การใช้งานที่ดีเยี่ยม

---
