# Phase 4 — Polish & Hardening

> **Status**: ✅ Done
> **Konteks**: Hackathon — kualitas dan ketahanan aplikasi
> **Selesai**: April 2026

---

## Goal

Memastikan aplikasi berjalan mulus tanpa edge case yang crash, UX terasa polished, dan siap didemonstrasikan kepada juri tanpa hambatan teknis.

---

## Tasks

### Error Handling & Validasi
- [x] Validasi form input lead di sisi client dengan Zod schema (`app/utils/validation.ts`)
- [x] Validasi server-side di `POST /api/leads` menggunakan Zod (`bodySchema.safeParse`)
- [x] Handle timeout Claude API (15 detik) dengan `Promise.race` + pesan error jelas (504)
- [x] Handle kasus Claude mengembalikan JSON tidak valid → `buildFallback()` diperkuat
- [x] Toast notification untuk setiap aksi: sukses, gagal, rate limit

### Security & Rate Limiting
- [x] Rate limiting di `POST /api/leads` — maks 10 req/menit per user (`server/middleware/rateLimit.ts`)
- [x] Semua endpoint API dilindungi `requireUserSession(event)`
- [x] Sanitasi input user di `sanitizeInput()` — strip HTML tags, batasi karakter, max 2000 char

### UX Improvements
- [x] Copy-to-clipboard dengan feedback visual (`copied` state mengubah icon + warna)
- [x] Animasi loading AI — pulsing brain icon + teks "AI sedang menganalisis..."
- [x] Empty state di lead list dengan CTA ke form input
- [x] Timestamp relatif di list lead ("2 jam lalu", "kemarin")

### Performance
- [x] DB index di kolom `status`, `score`, `createdAt` via Drizzle schema
- [x] Dashboard stats query — parallel fetch dengan `Promise.all`

### Kerapihan Kode
- [x] Semua `console.log` debug dihapus dari production code
- [x] ESLint clean — 0 errors, 0 warnings
- [x] `err: any` diganti dengan typed error handling

---

## Acceptance Criteria

- [x] Tidak ada halaman yang crash di happy path maupun edge case umum
- [x] Semua form memiliki validasi dan pesan error yang jelas
- [x] Copy draft balasan bekerja dengan feedback visual
- [x] Rate limiting aktif di endpoint AI (429 dengan pesan retry-after)
- [x] ESLint clean (0 error, 0 warning)

---

## Catatan Teknis

- Rate limiting menggunakan Nitro built-in `useStorage('cache')` — tidak butuh package tambahan
- Timeout AI: `Promise.race` antara Claude API call vs `setTimeout` 15 detik
- Zod diinstall sebagai runtime dependency karena dipakai di server dan client
- DB indexes: `idx_leads_status`, `idx_leads_score`, `idx_leads_created_at` — aktif setelah `db:push`
