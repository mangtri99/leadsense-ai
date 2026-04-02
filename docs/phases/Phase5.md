# Phase 5 — Demo Preparation

> **Status**: ✅ Done (code tasks)
> **Konteks**: Hackathon — kesiapan presentasi
> **Selesai**: April 2026

---

## Goal

Memastikan demo berjalan mulus dari awal hingga akhir, data dummy tersedia, alur presentasi sudah dilatih, dan tidak ada kejutan teknis saat di depan juri.

---

## Tasks

### Seed Data Demo
- [x] Buat script seed data dummy yang realistis (`server/seeds/demo.ts`)
- [x] 10 lead dengan variasi status:
  - [x] 3 lead Hot — Budi (Raja Ampat, 95), Siti (Maldives, 92), Keluarga Wijaya (Bali, 88)
  - [x] 3 lead Warm — Andi (Labuan Bajo, 65), Maya (Jepang, 60), Reza (Umrah+Turki, 55)
  - [x] 2 lead Cold — Dini (Lombok, 35), Tono (umum, 25)
  - [x] 2 lead Nurture — Lina (10), Bagas (5)
- [x] Command `pnpm db:seed` tersedia — reset leads + insert data baru
- [x] Seed idempotent: delete dulu lalu insert ulang

### Alur Demo End-to-End
- [x] Script demo lengkap dibuat (`docs/DEMO_SCRIPT.md`)
- [x] Pesan inquiry siap copy-paste untuk 2 skenario (Hot dan Cold)
- [x] Backup plan jika internet bermasalah sudah didokumentasikan
- [x] Jawaban untuk pertanyaan juri sudah disiapkan
- [ ] Latih alur demo minimal 3x *(manual — lakukan sendiri)*

### Teknis Demo
- [x] Error page (`app/error.vue`) — tampilan graceful saat 404/500
- [ ] Test di Chrome dan Safari *(manual)*
- [ ] Deploy ke Vercel/Railway/NuxtHub *(manual — butuh akun hosting)*
- [ ] Rekam video backup *(manual)*

### Presentasi
- [x] Slide outline lengkap dibuat (`docs/SLIDE_OUTLINE.md`) — 7 slide
- [x] Poin kunci yang harus disampaikan sudah didokumentasikan
- [ ] Desain slide aktual *(manual — gunakan Canva/Google Slides)*

---

## Acceptance Criteria

- [x] `pnpm db:seed` berjalan dan mengisi 10 lead demo yang konsisten
- [x] Demo script tersedia dan lengkap
- [ ] Demo end-to-end bisa diselesaikan dalam 8–10 menit *(validasi manual)*
- [ ] Tidak ada error visible di console browser saat demo *(validasi manual)*
- [ ] Aplikasi sudah ter-deploy dan bisa diakses via URL publik *(manual)*

---

## Catatan Teknis

- Seed menggunakan `tsx` untuk jalankan TypeScript langsung tanpa compile
- Seed data pre-analyzed (tidak memanggil Claude API) — aman dijalankan tanpa `ANTHROPIC_API_KEY`
- `db:seed` hanya delete tabel `leads`, bukan `users` — user demo tetap ada
- Error page menggunakan `clearError({ redirect: '/' })` dari Nuxt built-in

---

## Checklist Manual Sebelum Demo Hari H

- [ ] Jalankan `pnpm db:seed` untuk reset data
- [ ] Buka `http://localhost:3000`, login, pastikan 10 lead muncul
- [ ] Test input lead baru dengan pesan Hot → pastikan skor > 80
- [ ] Deploy ke URL publik dan test di sana
- [ ] Rekam video backup dari laptop
- [ ] Latih demo 3x sampai bisa selesai dalam 8-10 menit
