# Phase 1 — Foundation

> **Status**: ✅ Done
> **Konteks**: Hackathon setup awal
> **Selesai**: April 2026

---

## Goal

Membangun fondasi teknis aplikasi: project structure, database, auth, dan koneksi antar layer sudah berjalan.

---

## Tasks

- [x] Setup project Nuxt 3 dengan TypeScript
- [x] Konfigurasi Tailwind CSS + Nuxt UI
- [x] Setup PostgreSQL — menggunakan **Neon** (serverless PostgreSQL, cloud)
- [x] Integrasi Drizzle ORM
- [x] Definisi schema database:
  - [x] Tabel `users` (id, name, email, password)
  - [x] Tabel `leads` (id, name, rawMessage, score, status, aiAnalysis, aiReplyDraft, destination, budget, travelDate, paxCount)
  - [x] Tabel `follow_ups` (id, leadId, userId, note)
- [x] Jalankan `db:push` — tabel terbentuk di database (butuh DATABASE_URL diisi)
- [x] Setup `nuxt-auth-utils` untuk session-based auth
- [x] Buat halaman login sederhana
- [x] Setup `.env.example` dengan semua variabel yang dibutuhkan

---

## Acceptance Criteria

- [x] `npm run dev` berjalan tanpa error
- [x] `npm run db:push` berhasil membuat semua tabel
- [x] User bisa login dan session tersimpan
- [x] Struktur folder mengikuti konvensi Nuxt 3

---

## Catatan Teknis

- **Database**: Neon PostgreSQL (serverless) — `DATABASE_URL` berformat `postgresql://user:pass@ep-xxx.neon.tech/leadsense_db?sslmode=require`
- Neon mendukung branching database — bisa buat branch `dev` terpisah dari `main` untuk development aman
- Database schema disimpan di `server/database/schema.ts` (Drizzle)
- Seed user pertama dilakukan manual via Drizzle Studio (`npm run db:studio`)
- Password saat ini **plain text** — ini diketahui dan diterima untuk scope hackathon

---

## Dependensi yang Di-install

```
nuxt
@nuxt/ui
tailwindcss
drizzle-orm
drizzle-kit
@neondatabase/serverless   ← driver khusus Neon (bukan pg biasa)
nuxt-auth-utils
@vueuse/nuxt
typescript
```
