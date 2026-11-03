# 004 — ลดจาก 11 ตารางเหลือ 7 ตาราง

migration นี้เป็นสคริปต์ Node แทนไฟล์ `.sql` เพราะต้องเช็กว่าตาราง/คอลัมน์/FK มีอยู่ก่อนลบ
(TiDB ไม่มี stored procedure) จึงรันซ้ำได้และใช้ได้ทั้ง MySQL 8 และ TiDB Cloud

```bash
cd backend
npm run migrate
# MySQL เท่านั้น: โหลด trigger ชุดใหม่
mysql -u root -p < ../database/triggers.sql
```

รายละเอียดอยู่ใน [`backend/scripts/migrate.js`](../../backend/scripts/migrate.js)
ฐานข้อมูลที่สร้างใหม่จาก `schema.sql` ล่าสุดไม่ต้องรัน
