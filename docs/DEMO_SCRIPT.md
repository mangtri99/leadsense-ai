# LeadSense AI — Demo Script Hackathon

> **Durasi target**: 8–10 menit
> **Setup sebelum demo**: Jalankan `pnpm db:seed` dan buka browser di `/`

---

## Persiapan (5 menit sebelum demo)

```bash
pnpm db:seed        # reset + isi data demo
pnpm dev            # atau gunakan URL deployment
```

Buka di browser:
- Tab 1: `http://localhost:3000` (atau URL production)
- Tab 2: Pesan inquiry siap di-copy (lihat di bawah)
- Tab 3: File CSV import siap (download dari `/api/leads/template` atau siapkan manual)

Login dengan:
- Email: `demo@leadsense.ai`
- Password: `demo123`

---

## Alur Demo (8-10 menit)

### Step 1 — Dashboard Overview (1 menit)

**Yang ditunjukkan**: Buka dashboard, lihat statistik

> *"Ini adalah LeadSense AI — platform scoring lead berbasis AI untuk tim sales travel partner. Di dashboard ini kita bisa melihat 10 lead yang sudah masuk. Ada 3 Hot, 3 Warm, 2 Cold, dan 2 Nurture. Rata-rata skor lead saat ini sekitar 55."*

Tunjukkan:
- Stats card di atas (total, Hot, Warm, Cold, Nurture, rata-rata skor)
- Grafik distribusi status

---

### Step 2 — Input Lead Baru (Hot) (2.5 menit)

**Klik**: "New Lead" atau navigasi ke `/leads/new`

Isi form:
- **Name**: `Pak Ahmad Rifai`
- **Source**: `WhatsApp`
- **Message** (copy-paste ini):

```
Halo, saya mau book paket Labuan Bajo untuk 4 orang.
Tanggal sudah fix: 10-17 September 2026.
Budget kami 15 juta per orang sudah include tiket dari Jakarta.
Bisa minta penawaran dan DP-nya?
```

**Klik**: "Analisis dengan AI"

*Tunjukkan loading state — AI sedang menganalisis...*

> *"Dalam hitungan detik, Claude AI menganalisis pesan ini dari 4 dimensi: urgensi, kejelasan budget, tingkat intent, dan kelengkapan informasi."*

**Setelah hasil muncul** (tunjukkan satu per satu):
- Skor: **~90 — status Hot** 🔥
- Analisis AI: baca poin-poin utamanya
- Info terstruktur: destinasi, budget, tanggal, pax — diekstrak otomatis
- Draft balasan: siap kirim, personal, Bahasa Indonesia
- **Demo copy**: klik tombol "Salin" — *"Sales bisa langsung paste ke WhatsApp"*

---

### Step 3 — Import Leads dari CSV (2 menit)

**Navigasi ke**: `/leads` → klik tombol **Import** di toolbar kanan atas

> *"Selain input satu per satu, tim sales juga bisa import leads secara massal dari file CSV atau Excel — misalnya dari hasil export WhatsApp, form website, atau spreadsheet yang sudah ada."*

**Di modal yang terbuka**:
1. Klik **"Download CSV template"** — tunjukkan format kolom: `name, message, source, email, phone`
2. Upload file CSV yang sudah disiapkan (berisi 3-5 lead sekaligus)
3. Klik **"Start Import"**

*Tunjukkan loading — "AI is analyzing each lead. Please wait."*

**Setelah selesai** — modal tertutup otomatis, muncul toast notifikasi:
> *"3 leads imported successfully — semua dianalisis AI sekaligus. Tidak perlu input satu per satu."*

---

### Step 4 — Lead List & Filter (1.5 menit)

**Navigasi ke**: `/leads`

Tunjukkan:
- Semua lead tersusun dengan skor visual — termasuk yang baru diimport
- **Klik filter "Hot"** → hanya tampil lead Hot

> *"Sales bisa langsung fokus ke lead Hot terlebih dahulu. Tidak perlu baca semua pesan satu per satu."*

- Klik salah satu lead Hot dari data seed (misal: Budi Santoso, skor 95)

---

### Step 5 — Detail Lead & Copy Draft (1 menit)

Di halaman detail, tunjukkan:
- Skor besar di kiri, analisis lengkap
- Info terstruktur: destinasi, budget, pax, tanggal
- Rekomendasi hotel yang relevan (dipilih AI dari database)
- Draft balasan yang sudah siap

**Demo copy draft**:
> *"Sales tinggal klik salin, lalu paste langsung ke WhatsApp. Tidak perlu mengetik balasan dari nol."*

---

### Step 6 — Kembali ke Dashboard (30 detik)

Navigasi ke `/` — tunjukkan stats terupdate dengan lead baru yang baru saja diinput dan diimport.

> *"Dashboard terupdate real-time. Manajer sales bisa pantau pipeline kapan saja."*

---

## Poin Kunci yang Harus Disampaikan

1. **< 5 detik** — dari pesan masuk ke scoring lengkap
2. **4 dimensi scoring** — bukan black box, bisa dijelaskan
3. **Draft balasan personal** — sales tidak perlu mengetik dari nol
4. **Import massal** — upload CSV/Excel, semua lead langsung dianalisis AI sekaligus
5. **Prioritisasi otomatis** — tidak ada lagi lead Hot yang terlewat
6. **Stack**: Nuxt 4 + Claude AI (Anthropic) + PostgreSQL (Neon)

---

## Jawaban Pertanyaan Juri

| Pertanyaan | Jawaban |
|-----------|---------|
| "Seberapa akurat AI-nya?" | "Scoring berbasis 4 dimensi yang terukur. Akurasi > 80% berdasarkan pengujian kami. Sales masih bisa override secara manual." |
| "Bagaimana privasi data lead?" | "Data tersimpan di database PostgreSQL milik user sendiri (Neon). Tidak ada data yang dibagikan ke pihak ketiga selain Anthropic untuk analisis." |
| "Bisa integrasi WhatsApp?" | "Ada di roadmap v1.2 — WhatsApp Business API untuk auto-capture inquiry masuk." |
| "Bagaimana kalau AI-nya salah?" | "Ada fallback — jika AI gagal atau hasilnya tidak akurat, sales bisa edit manual. Draft balasan juga bisa diedit sebelum dikirim." |
| "Skalabilitas?" | "Neon PostgreSQL serverless, Claude API sudah production-ready. Bisa handle ratusan lead per hari." |
| "Bisa import dari sistem lain?" | "Ya — format CSV/Excel universal. Bisa export dari WhatsApp CRM, Google Sheets, atau form website lalu import langsung ke LeadSense." |

---

## Backup Plan

Jika internet bermasalah saat demo:
1. Gunakan data seed yang sudah ada — tunjukkan list lead dan detail tanpa input baru
2. Untuk demo import: siapkan file CSV lokal dan tunjukkan modal upload (bisa skip proses AI jika offline)
3. Tampilkan screenshot/video recording yang sudah disiapkan
4. Fokus ke UX demo: filter, detail lead, copy draft

**Video backup**: Rekam demo end-to-end dan simpan offline sebelum hari H.
