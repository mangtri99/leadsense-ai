# Phase 9 — v2.0 Platform: MCP & Advanced Analytics

> **Status**: 📋 Planned
> **Konteks**: Platform — embed ke ekosistem partner + analitik lanjutan
> **Target**: 6–12 bulan setelah hackathon

---

## Goal

Mengubah LeadSense AI dari aplikasi standalone menjadi platform yang bisa di-embed oleh travel partner ke dalam tools mereka sendiri, dilengkapi analitik konversi dan A/B testing draft balasan.

---

## Tasks

### MCP Server (Model Context Protocol)
- [ ] Riset arsitektur MCP untuk Anthropic tooling
- [ ] Buat MCP server LeadSense yang bisa di-embed ke platform partner
- [ ] Expose tools MCP:
  - `analyze_lead(message)` → scoring + klasifikasi
  - `get_lead_stats(dateRange)` → statistik pipeline
  - `generate_reply(leadId)` → draft balasan baru
- [ ] Dokumentasi integrasi untuk partner teknis
- [ ] Uji integrasi dengan Claude Desktop sebagai proof of concept

### Analitik Konversi Lanjutan
- [ ] Tracking status konversi lead: Contacted → Quoted → Booked → Cancelled
- [ ] Funnel visualisasi: berapa persen lead dari Hot yang akhirnya booking
- [ ] Conversion rate per source (WhatsApp vs Email vs Web Form)
- [ ] Conversion rate per sales rep
- [ ] Revenue attribution: total value booking yang datang dari lead AI-scored
- [ ] Export laporan bulanan PDF/Excel untuk manajer

### A/B Testing Draft Balasan
- [ ] Generate 2 versi draft balasan per lead (variant A dan B)
- [ ] Sales memilih versi mana yang dikirim
- [ ] Tracking: apakah lead yang menerima draft A lebih sering convert daripada B
- [ ] Dashboard A/B result setelah minimal 100 data points
- [ ] Auto-select template terbaik berdasarkan data historis

### API Publik
- [ ] Buat API publik dengan API key management
- [ ] Rate limiting per API key
- [ ] Dokumentasi API (OpenAPI / Swagger)
- [ ] Webhook outbound: notifikasi ke sistem eksternal saat lead statusnya berubah

---

## Acceptance Criteria

- [ ] MCP server bisa di-install dan berjalan di Claude Desktop
- [ ] Funnel konversi menampilkan data akurat dari leads historis
- [ ] A/B testing menghasilkan perbedaan statistik yang terukur
- [ ] API publik terdokumentasi dan bisa diakses dengan API key

---

## Catatan Teknis

- MCP server: gunakan SDK dari `@anthropic-ai/mcp-sdk`
- Konversi tracking membutuhkan tambahan state machine di tabel `leads`: kolom `conversionStatus`
- A/B testing statistically significant membutuhkan minimal ~100 sampel per variant
- Pertimbangkan memisahkan analytics database (read-only replica atau data warehouse seperti Turso)
- API publik: pertimbangkan menggunakan API gateway (Cloudflare Workers atau AWS API Gateway)

---

## Pertimbangan Arsitektur

Pada fase ini, pertimbangkan apakah monolitik Nuxt 3 masih cukup atau perlu dipisah:

| Opsi | Kelebihan | Kekurangan |
|------|-----------|------------|
| Tetap monolitik Nuxt 3 | Simple, satu deploy | Scalability terbatas |
| Pisah API service (Hono/Fastify) | Scalable, bisa deploy terpisah | Complexity meningkat |
| Nuxt + BFF pattern | Tetap Nuxt di frontend, API di belakang | Middle ground yang masuk akal |

**Rekomendasi**: Tetap monolitik sampai ada bottleneck nyata, jangan over-engineer.
