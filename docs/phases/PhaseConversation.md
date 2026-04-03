# Phase — Conversation Timeline

> **Status**: 📋 Planned
> **Context**: Upgrade follow-up menjadi full conversation thread per lead
> **Prerequisite**: Phase 7 selesai ✅

---

## Problem Statement

Follow-up saat ini hanya bisa menyimpan **catatan internal sales**. Tidak ada cara untuk merekam lanjutan pesan dari customer setelah lead pertama masuk. Akibatnya:

- Sales harus bolak-balik buka WhatsApp/email untuk ingat konteks percakapan
- Tidak ada history lengkap di satu tempat
- Tidak bisa tahu apakah lead makin panas atau makin dingin setelah follow-up

---

## Goal

Mengubah follow-up menjadi **conversation timeline** — semua interaksi antara sales dan customer terekam secara kronologis di halaman detail lead.

---

## Tampilan Timeline (Target)

```
┌─────────────────────────────────────────┐
│ [Customer]  08 Mar, 10:00               │
│ "Halo, mau tanya paket Raja Ampat..."   │  ← pesan awal (rawMessage)
└─────────────────────────────────────────┘
         ↓ AI Analysis: Score 95 — Hot
┌─────────────────────────────────────────┐
│ [Sales - Budi]  08 Mar, 10:05  🔒       │
│ "Sudah kirim itinerary via WA"          │  ← internal note
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [Customer]  08 Mar, 14:30               │
│ "Ok, tapi bisa kurang harga ga?         │  ← customer reply baru
│  Budget kami 18 juta/orang max"         │
└─────────────────────────────────────────┘
         ↓ AI Re-analysis: Score 90 — masih Hot, intent kuat
┌─────────────────────────────────────────┐
│ [Sales - Budi]  08 Mar, 15:00  🔒       │
│ "Sudah nego, deal di 18 juta/orang"     │  ← internal note
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ [Customer]  09 Mar, 09:00               │
│ "Oke deal! Kirim invoice ya"            │  ← closing signal!
└─────────────────────────────────────────┘
         ↓ AI Re-analysis: Score 99 — Hot 🔥 CLOSING
```

---

## Tasks

### Part A — Database & API

- [ ] **Migrasi schema `follow_ups`** — tambah 2 kolom baru:
  - `type: text` — nilai: `'internal'` | `'customer_message'`, default `'internal'`
  - `senderName: text` — nama pengirim custom (null = pakai nama sales dari session)
  - `userId` dijadikan **nullable** agar customer messages tidak butuh FK ke users

- [ ] **Update `POST /api/leads/[id]/follow-ups`** — terima optional field `type` dan `senderName`

- [ ] **Buat `POST /api/leads/[id]/analyze-reply`** — endpoint baru untuk:
  1. Simpan pesan customer ke `follow_ups` dengan `type: 'customer_message'`
  2. Kirim pesan ke Claude API untuk re-analysis (konteks: pesan awal + semua customer messages sebelumnya)
  3. Update `score`, `status`, `aiReplyDraft` di tabel `leads`
  4. Jika status baru = Hot → push SSE + kirim email (reuse logic Phase 7)
  5. Return hasil analisis baru

- [ ] **Update `GET /api/leads/[id]/follow-ups`** — return field `type` dan `senderName`

- [ ] **Tambah kolom `lastActivityAt`** di tabel `leads` — diupdate setiap ada follow-up atau customer reply baru

### Part B — UI: Conversation Timeline

- [ ] **Redesign section follow-up** di `app/pages/leads/[id].vue`:
  - Entry pertama: pesan awal customer (`rawMessage`) + tanggal lead masuk
  - Bubble berbeda berdasarkan `type`:
    - `customer_message` → bubble primary/biru, rata kiri, avatar inisial nama customer
    - `internal` → bubble abu-abu/elevated, rata kiri, avatar ikon sales + label 🔒 Internal
  - AI score indicator muncul di antara entries jika score berubah

- [ ] **Dua tombol aksi** di bawah timeline:
  - **"Add Note"** — catatan internal (behavior existing, tidak berubah)
  - **"Log Customer Reply"** — input pesan lanjutan dari customer

- [ ] **Form "Log Customer Reply"**:
  - Textarea untuk pesan customer
  - Toggle "Re-analyze with AI" (default: aktif)
  - Jika AI aktif: setelah submit tampilkan inline result — score baru, status, reply draft baru

- [ ] **Score change indicator** setelah re-analysis:
  - Score naik: `↑ 65 → 88` (badge hijau)
  - Score turun: `↓ 88 → 60` (badge oranye)
  - Status berubah: alert banner + update badge di header lead

### Part C — Lead Status Auto-update

- [ ] Jika re-analysis menghasilkan `status` berbeda → auto-update `leads.status` dan `leads.score`
- [ ] Jika status baru = `Hot` → trigger SSE + email notifikasi (reuse Phase 7)

---

## Schema Changes

```typescript
// server/database/schema.ts

export const followUps = pgTable('follow_ups', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),  // nullable — customer messages tidak punya userId
  note: text('note').notNull(),
  type: text('type').notNull().default('internal'),        // 'internal' | 'customer_message'
  senderName: text('sender_name'),                         // nama custom (customer / sales override)
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const leads = pgTable('leads', {
  // ... kolom existing ...
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull()  // NEW
})
```

SQL migration (non-breaking — semua kolom baru punya default):
```sql
ALTER TABLE follow_ups ADD COLUMN type TEXT NOT NULL DEFAULT 'internal';
ALTER TABLE follow_ups ADD COLUMN sender_name TEXT;
ALTER TABLE follow_ups ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE leads ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT NOW();
```

---

## API Contracts

### `POST /api/leads/[id]/follow-ups` (existing — backward compatible)
```json
// Request lama tetap jalan
{ "note": "Sudah kirim itinerary" }
```

### `POST /api/leads/[id]/analyze-reply` ← NEW
```json
// Request
{
  "message": "Ok tapi bisa kurang harga ga? Budget 18 juta max",
  "reanalyze": true
}

// Response
{
  "followUp": { "id": 5, "type": "customer_message", "note": "...", "createdAt": "..." },
  "analysis": {
    "score": 90,
    "status": "Hot",
    "previousScore": 95,
    "previousStatus": "Hot",
    "scoreDiff": -5,
    "statusChanged": false,
    "replyDraft": "Halo! Untuk budget 18 juta/orang kami bisa akomodasi dengan paket..."
  }
}
```

---

## Keputusan Desain

| Pertanyaan | Keputusan | Alasan |
|---|---|---|
| AI re-analyze tiap customer reply? | Opsional (toggle) | Hemat cost, bisa disable untuk reply singkat |
| Siapa yang update status lead? | Server (analyze-reply endpoint) | Konsisten, tidak perlu client logic |
| Nama customer di reply | Ambil dari `lead.name` | Sederhana, bisa di-override via `senderName` |
| Data follow-up lama | Tetap tampil normal | Default `type = 'internal'`, no breaking change |
| Rate limit analyze-reply | 10/menit per lead | Cegah abuse Claude API |

---

## Acceptance Criteria

- [ ] Timeline menampilkan semua interaksi secara kronologis (customer + sales)
- [ ] Pesan customer bisa disimpan tanpa AI re-analyze (toggle off)
- [ ] AI re-analyze mengupdate score, status, dan reply draft di lead
- [ ] Visual bubble berbeda antara `internal` dan `customer_message`
- [ ] Score change indicator muncul jika score berubah setelah re-analyze
- [ ] Data follow-up lama tetap tampil normal — tidak ada breaking change
- [ ] Jika status berubah jadi Hot → SSE + email notifikasi berjalan
