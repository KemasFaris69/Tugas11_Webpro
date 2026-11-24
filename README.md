# SecureTask — Tugas Pekan 11 JWT Auth + Keamanan Dasar

Aplikasi CRUD tugas pribadi dengan React, NestJS, Prisma, PostgreSQL, bcrypt, JWT, Helmet, dan rate limiting.

## Persiapan
- Node.js 20+ dan PostgreSQL berjalan.
- Buat database kosong bernama `securetask` (melalui pgAdmin atau `CREATE DATABASE securetask;`).

## Backend
```bash
cd backend
npm install
```
Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` dengan kredensial PostgreSQL milikmu dan `JWT_SECRET` dengan string acak panjang. **Jangan commit file `.env`.**

```bash
npx prisma migrate dev --name init
npm run start:dev
```
API berjalan di http://localhost:3000.

## Frontend (terminal kedua)
```bash
cd frontend
npm install
```
Salin `.env.example` menjadi `.env` jika perlu, lalu:
```bash
npm run dev
```
Buka http://localhost:5173.

## Endpoint
| Method | Endpoint | Auth |
|---|---|---|
| POST | /auth/register | Publik |
| POST | /auth/login | Publik |
| GET | /tasks | Bearer JWT |
| POST | /tasks | Bearer JWT |
| PATCH | /tasks/:id | Bearer JWT + pemilik |
| DELETE | /tasks/:id | Bearer JWT + pemilik |

Contoh body register/login: `{ "email": "demo@example.com", "password": "Password123!" }`.
Contoh body POST /tasks: `{ "title": "Belajar JWT", "description": "Latihan pekan 11" }`.

## Bukti screenshot yang perlu dikumpulkan
1. DevTools > Network > POST /auth/login > Response berisi `accessToken` (sensor sebagian token sebelum dibagikan).
2. DevTools > Network > GET /tasks > Request Headers > `Authorization: Bearer ...` (sensor token).
3. Gunakan Postman atau curl tanpa Authorization ke GET /tasks untuk bukti 401 (jangan gunakan token palsu).
4. pgAdmin > tabel User > kolom `passwordHash` memperlihatkan hash bcrypt, bukan password asli.
5. DevTools > Network > GET /tasks > Response Headers > `x-content-type-options: nosniff` dari Helmet. Alternatif: login lebih dari 5 kali dalam 60 detik untuk respons 429.
6. Sertakan link repository GitHub dan penjelasan singkat maksimal 1 halaman.

## Keamanan
- Password di-hash dengan bcrypt cost 10 dan dibandingkan dengan `bcrypt.compare`.
- JWT bertanda tangan berlaku 15 menit; hanya `sub` dan `email` disimpan di payload.
- `JwtAuthGuard` menolak token kosong, salah, atau kedaluwarsa (401).
- `ownerId` diambil dari JWT yang sudah diverifikasi; tidak dipercaya dari body. Query selalu difilter `ownerId` sehingga pengguna tidak dapat mengubah tugas pengguna lain (IDOR).
- Prisma memakai parameterisasi query untuk mengurangi risiko SQL injection; DTO dan ValidationPipe memvalidasi input.
- Helmet mengatur header keamanan, dan Throttler membatasi login 5 request/menit.
- React merender input sebagai teks biasa, bukan HTML mentah, untuk mengurangi risiko XSS.

## Catatan
Token disimpan **hanya di memori React** (tidak di localStorage); reload akan logout. Ini sengaja menyederhanakan tugas dan mengurangi risiko pencurian token dari penyimpanan persisten, tetapi belum mencakup refresh token, session persistence, atau logout/revocation di server. Untuk produksi, tambahkan HTTPS, pengujian keamanan, mekanisme refresh token yang aman, dan hardening lainnya.

**Status:** kode sumber disediakan sebagai starter implementasi; perlu di-install, dimigrasikan, dijalankan, dan diuji pada mesin pengguna sebelum diklaim berhasil.
