# Phase 8 — v1.2 Growth: Integrasi & Multi-User

> **Status**: 📋 Planned
> **Konteks**: Pertumbuhan — memperluas sumber lead dan tim
> **Target**: 3–5 bulan setelah hackathon

---

## Goal

Memperluas sumber lead masuk (WhatsApp Business API) dan mendukung tim sales dengan multiple user yang memiliki peran berbeda (admin vs sales rep).

---

## Tasks

### WhatsApp Business API Integration
- [ ] Riset dan pilih provider: Meta Cloud API (langsung) atau middleware (Wati, Fonnte, dll)
- [ ] Buat webhook endpoint: `POST /api/webhooks/whatsapp`
- [ ] Auto-capture pesan masuk dari WhatsApp → simpan sebagai lead baru
- [ ] Trigger analisis AI otomatis saat lead dari WhatsApp masuk
- [ ] Tampilkan badge "WhatsApp" di sumber lead
- [ ] Handle rate limiting dari WhatsApp API

### Multi-User & Role Management
- [ ] Tambahkan kolom `role` di tabel `users` (admin / sales)
- [ ] Admin permissions:
  - [ ] Bisa melihat semua lead
  - [ ] Bisa mengelola user (invite, nonaktifkan)
  - [ ] Akses statistik tim
- [ ] Sales permissions:
  - [ ] Hanya melihat lead yang di-assign ke mereka
  - [ ] Bisa menambah follow-up catatan
- [ ] Lead assignment: admin bisa assign lead ke sales tertentu
- [ ] Kolom `assignedTo` di tabel `leads`
- [ ] Halaman manajemen user untuk admin

### Dashboard Peningkatan
- [ ] Statistik per sales: siapa yang paling banyak close lead
- [ ] Leaderboard tim sales
- [ ] Filter lead by assigned sales (untuk admin)
- [ ] Timeline aktivitas per lead

---

## Acceptance Criteria

- [ ] Pesan masuk dari WhatsApp otomatis menjadi lead + dianalisis AI dalam < 30 detik
- [ ] Admin bisa mengelola user dan assign lead
- [ ] Sales hanya melihat lead yang di-assign ke mereka
- [ ] Webhook WhatsApp merespons dalam < 5 detik (sesuai requirement Meta)

---

## Catatan Teknis

- WhatsApp Business API membutuhkan verifikasi bisnis Meta — proses bisa 1–2 minggu
- Alternatif lebih cepat: gunakan provider seperti Fonnte atau Wati yang sudah punya izin
- Role-based access control (RBAC) bisa diimplementasi di middleware Nuxt
- Pertimbangkan menambah kolom `source` enum yang lebih luas: WhatsApp, Email, Instagram, Referral, Web Form
- Lead assignment UI bisa menggunakan `USelect` atau drag-and-drop di kanban view (opsional)
