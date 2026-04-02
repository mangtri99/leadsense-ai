# Phase 2 — AI Core

> **Status**: ✅ Done
> **Konteks**: Hackathon — inti fitur AI
> **Selesai**: April 2026

---

## Goal

Mengintegrasikan Claude API untuk menganalisis pesan inquiry lead dan menghasilkan output terstruktur: skor, status, analisis, draft balasan, dan rekomendasi paket.

---

## Tasks

- [x] Install dan konfigurasi `@anthropic-ai/sdk`
- [x] Buat fungsi `analyzeLeadWithAI()` di server (`server/utils/ai.ts`)
- [x] Desain prompt engineering untuk 4 dimensi scoring:
  - [x] Urgensi (30 poin) — tanggal keberangkatan sudah ditentukan
  - [x] Kejelasan Budget (25 poin) — budget spesifik disebutkan
  - [x] Tingkat Intent (25 poin) — bahasa menunjukkan keputusan
  - [x] Kelengkapan Info (20 poin) — destinasi, pax, tanggal, budget lengkap
- [x] Output AI berupa JSON terstruktur:
  - [x] `score` (0–100)
  - [x] `status` (Hot / Warm / Cold / Nurture)
  - [x] `analysis` — penjelasan singkat alasan scoring
  - [x] `replyDraft` — draft balasan Bahasa Indonesia
  - [x] `recommendations` — rekomendasi paket wisata
  - [x] Ekstraksi: `destination`, `budget`, `travelDate`, `paxCount`
- [x] Error handling untuk response AI yang tidak valid / tidak konsisten
- [x] Simpan hasil analisis ke database setelah AI selesai

---

## Acceptance Criteria

- [x] Input pesan inquiry → output JSON terstruktur dalam < 5 detik
- [x] Klasifikasi status sesuai range skor:
  - Hot: 80–100
  - Warm: 50–79
  - Cold: 20–49
  - Nurture: 0–19
- [x] Jika Claude mengembalikan format tidak valid → fallback aman, tidak crash
- [x] Data tersimpan ke tabel `leads`

---

## Catatan Teknis

- Model yang digunakan: `claude-sonnet-4` (sesuai spesifikasi hackathon)
- Prompt menggunakan format system + user message
- Response diparsing sebagai JSON — terdapat fallback jika JSON tidak valid
- Tidak ada rate limiting saat ini → **direncanakan di Phase 4**
- API key disimpan di `.env` sebagai `ANTHROPIC_API_KEY`

---

## Contoh Prompt (Ringkasan)

```
System: Kamu adalah AI analis lead untuk tim sales travel partner.
Analisis pesan inquiry berikut dan kembalikan JSON dengan format:
{ score, status, analysis, replyDraft, recommendations, destination, budget, travelDate, paxCount }

User: [rawMessage dari lead]
```
