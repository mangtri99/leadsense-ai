# Phase 3 — UI/UX Dashboard

> **Status**: ✅ Done
> **Konteks**: Hackathon — antarmuka pengguna
> **Selesai**: April 2026

---

## Goal

Membangun tampilan dashboard yang fungsional dan presentable: form input lead, list lead dengan filter, halaman detail, dan statistik real-time.

---

## Tasks

- [x] Setup layout dashboard (sidebar, header, content) menggunakan Nuxt UI Dashboard components
- [x] Halaman login
- [x] Halaman dashboard home — statistik ringkasan:
  - [x] Total lead
  - [x] Breakdown per status (Hot, Warm, Cold, Nurture)
  - [x] Rata-rata skor
- [x] Halaman lead list:
  - [x] Tampilkan semua lead dalam tabel/card
  - [x] Filter berdasarkan status
  - [x] Indikator visual untuk setiap status (warna, badge)
- [x] Form input lead baru:
  - [x] Field: nama, pesan inquiry, source (WhatsApp, Email, dll)
  - [x] Tombol "Analisis dengan AI"
  - [x] Loading state saat AI memproses
- [x] Halaman detail lead:
  - [x] Tampilkan skor + status + analisis AI
  - [x] Draft balasan yang bisa di-copy
  - [x] Rekomendasi paket wisata
  - [x] Info terstruktur: destinasi, budget, tanggal, pax
- [x] Responsive layout (mobile-friendly)
- [x] Dark mode support

---

## Acceptance Criteria

- [x] Semua halaman dapat diakses setelah login
- [x] Form input lead menampilkan hasil AI setelah analisis
- [x] Filter status bekerja di lead list
- [x] Halaman detail menampilkan semua output AI
- [x] Tampilan konsisten di desktop dan mobile

---

## Catatan Teknis

- Menggunakan Nuxt UI v4 dengan komponen `UDashboardPanel`, `UDashboardNavbar`, `UDashboardSidebar`
- Komponen sidebar: `TeamsMenu.vue`, `UserMenu.vue`
- Notifikasi: `NotificationsSlideover.vue`
- Composable `useDashboard.ts` untuk shared state (notifications, keyboard shortcuts)
- Color scheme: primary `green`, neutral `zinc`
