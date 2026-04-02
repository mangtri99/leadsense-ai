# LeadSense AI — Development Strategy

> **AI-Powered Lead Scoring untuk Tim Sales Travel Partner**
> Hackathon Project 2026 → Production Roadmap

---

## Apakah Strategi Phase-based Markdown Ini Efisien dan Berkelanjutan?

**Jawaban: Ya, dengan syarat dijalankan dengan disiplin.**

### Keunggulan Pendekatan Ini

| Aspek | Manfaat |
|-------|---------|
| **Version-controlled** | Setiap perubahan plan terlacak di Git bersama kode |
| **AI-readable** | Claude Code bisa membaca context langsung dari file ini |
| **Zero tooling cost** | Tidak butuh Jira, Notion, atau tool berbayar |
| **Co-located** | Plan ada di dalam repo, bukan di tool eksternal yang terpisah |
| **Markdown = portable** | Bisa di-render di GitHub, VS Code, Obsidian, dll |

### Risiko yang Perlu Dihindari

| Risiko | Mitigasi |
|--------|----------|
| File tidak pernah diupdate | Jadikan commit rule: setiap task selesai, update status di Phase file |
| Terlalu detail / terlalu abstrak | Gunakan format: Goal → Tasks → Acceptance Criteria → Done |
| Sulit tracking progress lintas fase | Gunakan `DEVELOPMENT_STRATEGY.md` ini sebagai index terpusat |
| Duplikasi dengan `CLAUDE.md` | `CLAUDE.md` = konteks teknis, Phase files = task & progress |

### Rekomendasi Workflow

```
1. Buka Phase file yang sedang aktif
2. Pilih satu task, kerjakan
3. Update status task ([ ] → [x])
4. Commit code + commit update Phase file bersamaan
5. Kalau ada keputusan teknis baru → update Phase file
```

---

## Status Overview

| Phase | Nama | Status | Target |
|-------|------|--------|--------|
| [Phase 1](phases/Phase1.md) | Foundation | ✅ Done | Hackathon |
| [Phase 2](phases/Phase2.md) | AI Core | ✅ Done | Hackathon |
| [Phase 3](phases/Phase3.md) | UI/UX Dashboard | ✅ Done | Hackathon |
| [Phase 4](phases/Phase4.md) | Polish & Hardening | ✅ Done | Hackathon |
| [Phase 5](phases/Phase5.md) | Demo Preparation | ✅ Done (code) | Hackathon |
| [Phase 6](phases/Phase6.md) | Bonus Features | ✅ Done | Hackathon |
| [Phase 7](phases/Phase7.md) | v1.1 — Post-Hackathon | 📋 Planned | 1–2 bulan setelah demo |
| [Phase 8](phases/Phase8.md) | v1.2 — Growth | 📋 Planned | 3–5 bulan |
| [Phase 9](phases/Phase9.md) | v2.0 — Platform | 📋 Planned | 6–12 bulan |
| [Phase 10](phases/Phase10.md) | v3.0 — Vision | 📋 Long-term | 12+ bulan |

---

## Arsitektur Keputusan Penting

### Stack yang Dipakai
- **Frontend + Backend**: Nuxt 3 (monolitik, cocok untuk MVP)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Claude API (`claude-sonnet-4`)
- **Auth**: nuxt-auth-utils (session-based)
- **Styling**: Tailwind CSS + Nuxt UI

### Batasan yang Sudah Diketahui (Technical Debt)
- [ ] Password disimpan plain text → **wajib bcrypt sebelum production**
- [ ] Tidak ada rate limiting di endpoint AI → tambahkan di Phase 4
- [ ] Tidak ada DB index di kolom `score` dan `status` → tambahkan di Phase 7
- [ ] Error handling Claude API masih basic → perkuat di Phase 4

---

## Panduan Kontribusi ke Dokumen Ini

1. **Jangan ubah fase yang sudah Done** kecuali untuk koreksi faktual
2. **Setiap task baru** tambahkan ke fase yang relevan dengan format `- [ ] Task`
3. **Setelah selesai** ubah `- [ ]` menjadi `- [x]` dan tambahkan tanggal
4. **Keputusan arsitektur** catat di bagian "Catatan Teknis" masing-masing Phase file
5. **Jangan hapus task yang di-skip** — ubah menjadi `- [~] Task (skipped: alasan)`
