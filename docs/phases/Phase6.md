# Phase 6 — Bonus Features

> **Status**: ✅ Done
> **Konteks**: Hackathon — nilai tambah
> **Selesai**: April 2026

---

## Goal

Menambahkan fitur-fitur bonus yang meningkatkan nilai demonstrasi dan membedakan LeadSense AI dari solusi serupa, tanpa mengorbankan stabilitas core features.

---

## Tasks

### Follow-up History
- [x] API `GET /api/leads/:id/follow-ups` — ambil semua catatan beserta nama user
- [x] API `POST /api/leads/:id/follow-ups` — tambah catatan baru (Zod validated)
- [x] UI di halaman detail lead — list catatan dengan avatar, nama, timestamp relatif
- [x] Form tambah catatan dengan Ctrl+Enter shortcut
- [x] Toast sukses/gagal setelah submit

### Export Data
- [x] API `GET /api/leads/export` — generate CSV dengan filter status opsional
- [x] Tombol "Export CSV" di toolbar lead list
- [x] Export mengikuti filter status yang aktif
- [x] Filename otomatis: `leadsense-leads-YYYY-MM-DD.csv`

### Real-time Notifications (SSE)
- [x] SSE endpoint `GET /api/notifications/stream` dengan `createEventStream` dari h3
- [x] `POST /api/leads` push ke Nitro storage saat lead Hot baru masuk
- [x] Layout berlangganan SSE saat mount, tutup saat unmount
- [x] Toast muncul otomatis saat ada Hot lead baru
- [x] Badge counter di tombol notifikasi (terupdate real-time)
- [x] Counter reset saat panel notifikasi dibuka

---

## Acceptance Criteria

- [x] Follow-up history tampil di halaman detail lead
- [x] Export CSV menghasilkan file yang bisa dibuka di Excel/Sheets
- [x] Notifikasi SSE + toast muncul dalam < 3 detik setelah lead Hot dibuat

---

## Catatan Teknis

- SSE polling interval: 3 detik (via `setInterval` di server handler)
- Hot lead queue disimpan di `cache:sse:hot-leads` menggunakan Nitro `useStorage('cache')`
- Export CSV tanpa library tambahan — escape manual untuk karakter khusus
- Follow-up `userId` diambil dari session (`session.user.id`) — tidak bisa di-spoof
- `hotLeadCount` disimpan di `useDashboard` composable (shared state) agar badge dan layout sync
