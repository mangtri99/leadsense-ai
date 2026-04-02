# Phase 7 — v1.1 Post-Hackathon: Production Readiness

> **Status**: 📋 Planned
> **Konteks**: Pasca hackathon — siap untuk pengguna nyata
> **Target**: 1–2 bulan setelah demo hackathon

---

## Goal

Mengubah prototype hackathon menjadi aplikasi yang aman, stabil, dan bisa digunakan oleh tim sales nyata di perusahaan travel partner.

---

## Tasks

### Security (Wajib sebelum onboarding user nyata)
- [ ] Hash password dengan `bcrypt` — **ini blocker utama sebelum go-live**
  - Ganti semua `password` plain text di tabel `users`
  - Update auth flow: `bcrypt.hash()` saat register, `bcrypt.compare()` saat login
- [ ] Implementasi CSRF protection
- [ ] Audit semua endpoint: pastikan tidak ada yang bisa diakses tanpa auth
- [ ] Tambahkan input sanitization di semua field yang masuk ke DB

### Database
- [ ] Tambahkan index di kolom `leads.score` dan `leads.status`
- [ ] Tambahkan index di `leads.createdAt` untuk sorting
- [ ] Setup database backup otomatis (harian)
- [ ] Buat migration script yang proper (bukan hanya `db:push`)

### Fitur Lanjutan
- [ ] Follow-up history per lead (jika belum selesai di Phase 6)
- [ ] Export data lead ke Excel / CSV
- [ ] Email notifikasi untuk lead Hot baru
  - Menggunakan Resend atau Nodemailer
  - Template email: nama lead, skor, link ke detail
- [ ] Pagination di lead list (jika jumlah lead > 50)

### Observability
- [ ] Setup error logging (Sentry atau Axiom)
- [ ] Logging setiap panggilan ke Claude API (durasi, token usage)
- [ ] Health check endpoint: `GET /api/health`
- [ ] Alert jika Claude API error rate > 5%

### Onboarding
- [ ] Halaman register user baru (atau invite system)
- [ ] Halaman profile untuk edit nama dan ganti password
- [ ] Dokumentasi singkat untuk user (README atau halaman Help)

---

## Acceptance Criteria

- [ ] Password tersimpan sebagai bcrypt hash, bukan plain text
- [ ] Semua endpoint API membutuhkan autentikasi
- [ ] Error di production ter-log ke Sentry / logging tool
- [ ] Email notifikasi terkirim saat lead Hot baru masuk
- [ ] Aplikasi stabil dengan 5–10 user aktif bersamaan

---

## Catatan Teknis

- Migrasi password: perlu reset manual semua password existing user
- Gunakan `drizzle-kit generate` + `migrate` untuk schema changes (bukan `push`) di production
- Email: Resend lebih mudah di-setup daripada Nodemailer untuk Nuxt 3
- Pertimbangkan menggunakan `@nuxt/auth` jika fitur auth akan berkembang signifikan
