# LeadSense AI — Slide Outline Presentasi

> **Total slide**: 6 slide + 1 demo
> **Durasi presentasi**: 10-15 menit (5 menit slide + 8-10 menit demo)
> **Tools**: Google Slides / Canva / Pitch

---

## Slide 1 — Problem (1 menit)

**Judul**: *"Tim sales travel kewalahan dengan inquiry yang datang tanpa henti"*

**Konten**:
- 📩 Volume inquiry tinggi dari WhatsApp, Instagram, Email — semuanya campur aduk
- ⏰ Waktu respons lambat = lead berpindah ke kompetitor
- 🔍 Tidak ada sistem untuk menentukan mana yang harus dihubungi duluan
- 🔄 Follow-up manual yang tidak konsisten

**Visual**: Screenshot WhatsApp penuh pesan inquiry yang tidak terbaca

**Data pendukung**:
> *"Rata-rata sales travel menghabiskan 2-3 jam/hari hanya untuk membaca dan membalas inquiry secara manual"*

---

## Slide 2 — Solusi (1 menit)

**Judul**: *"LeadSense AI — Prioritaskan lead yang benar-benar siap booking"*

**Konten**:
- 🤖 Scoring otomatis 0-100 untuk setiap lead masuk
- 🔥 Klasifikasi instan: Hot / Warm / Cold / Nurture
- ✍️ Draft balasan personal siap pakai
- 📦 Rekomendasi paket yang relevan
- 📊 Dashboard analitik tim sales

**Visual**: Screenshot dashboard LeadSense dengan lead Hot yang highlight

---

## Slide 3 — Cara Kerja AI (1 menit)

**Judul**: *"4 Dimensi Scoring — Bukan Black Box"*

**Visual**: Diagram/tabel scoring

| Dimensi | Bobot | Contoh |
|---------|-------|--------|
| Urgensi | 30 poin | Tanggal keberangkatan sudah fix |
| Kejelasan Budget | 25 poin | "Budget 20 juta per orang" |
| Tingkat Intent | 25 poin | "Mau DP sekarang" |
| Kelengkapan Info | 20 poin | Destinasi, pax, tanggal, budget semua ada |

**Catatan**: Powered by **Claude AI (Anthropic)** — model yang sama yang digunakan enterprise global

---

## Slide 4 — Tech Stack (30 detik)

**Judul**: *"Dibangun dengan teknologi modern yang production-ready"*

**Visual**: Logo grid

```
Frontend + Backend : Nuxt 3 (Vue 3)
AI Engine          : Claude API (Anthropic)
Database           : PostgreSQL (Neon Serverless)
ORM                : Drizzle ORM
Styling            : Tailwind CSS + Nuxt UI
Auth               : nuxt-auth-utils
```

**Highlight**: Monolithic architecture — cepat dikembangkan, mudah di-deploy

---

## Slide 5 — DEMO LIVE

**Judul**: *"Demo Live — LeadSense AI"*

Jalankan demo sesuai `DEMO_SCRIPT.md`

*(Slide ini hanya sebagai background saat demo berlangsung)*

---

## Slide 6 — Hasil Bisnis yang Diharapkan

**Judul**: *"Dampak nyata untuk tim sales travel"*

**Konten**:

| Metrik | Sebelum | Dengan LeadSense AI |
|--------|---------|---------------------|
| Waktu analisis per lead | 5-10 menit manual | < 5 detik otomatis |
| Waktu follow-up/hari | 2-3 jam | ~30 menit |
| Lead Hot yang terlewat | Sering | Hampir tidak ada |
| Conversion rate | Baseline | Target +30-40% |

**Quote fiktif (bisa diganti testimoni nyata)**:
> *"Dengan LeadSense AI, saya bisa fokus ke closing daripada sorting pesan"*

---

## Slide 7 — Roadmap

**Judul**: *"Ini baru permulaan"*

**Timeline**:

```
Sekarang (v1.0)
└── Lead scoring AI, dashboard, draft balasan

v1.1 — 1-2 bulan
└── Follow-up history, export Excel, notifikasi Hot lead

v1.2 — 3-5 bulan
└── WhatsApp Business API, multi-user dengan role admin/sales

v2.0 — 6-12 bulan
└── MCP Server untuk embed ke platform partner, A/B testing draft

v3.0 — Visi
└── Prediksi revenue pipeline, mobile app, integrasi sistem booking
```

**Closing statement**:
> *"LeadSense AI bukan hanya tool — ini adalah co-pilot AI untuk setiap sales di industri travel Indonesia."*

---

## Tips Desain Slide

- Gunakan warna brand: **hijau** (primary) + **zinc** (neutral) sesuai `app.config.ts`
- Font: Inter atau Plus Jakarta Sans
- Minimal text per slide — lebih banyak visual dan angka
- Animasi: minimal, cukup fade in per bullet point
- Pastikan readable dari jarak 5 meter
