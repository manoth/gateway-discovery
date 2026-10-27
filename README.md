# Health Gateway Discovery

แหล่งตั้งค่าปลายทาง API ส่วนกลางสำหรับ Health Agent ทุกหน่วยบริการ

## วิธีเปลี่ยน API URL

1. แก้ `endpoints[].url` ใน `config.json`
2. Commit และ push เข้า branch `main`
3. GitHub Actions จะสร้าง revision ใหม่ ตรวจสอบค่า เซ็น manifest และเผยแพร่ผ่าน GitHub Pages อัตโนมัติ

Agent จะอ่านค่าจาก:

```text
https://manoth.github.io/gateway-discovery/endpoint.json
```

สำหรับ production ให้ใช้ URL แบบ HTTPS เท่านั้น ส่วน `http://localhost` อนุญาตเพื่อการจำลองในเครื่อง
ค่า `revision` ในไฟล์ใช้เฉพาะตอน build ในเครื่อง เมื่อทำงานบน GitHub ระบบจะสร้าง revision ที่เพิ่มขึ้นให้อัตโนมัติ

## ความปลอดภัย

- Repository นี้เผยแพร่เฉพาะ URL และลายเซ็นสำหรับตรวจสอบ จึงไม่มีรหัสผ่านหรือข้อมูลลับ
- Private signing key เก็บใน GitHub Actions secret ชื่อ `DISCOVERY_PRIVATE_KEY`
- ห้าม commit ไฟล์ `.pem`, `.env` หรือ private key
- Repository ไม่มี collaborator บัญชีอื่น ผู้ที่แก้ไขและ publish ค่าได้โดยตรงจึงมีเพียงเจ้าของบัญชี `manoth`
