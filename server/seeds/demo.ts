import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import bcrypt from 'bcryptjs'
import { leads, users } from '../database/schema'

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL tidak ditemukan di environment')
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql)

  console.log('🌱 Memulai seed demo data...')

  // Reset leads (urutan penting: follow_ups dulu karena FK)
  await db.delete(leads)
  console.log('✓ Leads dihapus')

  // Upsert demo user
  const existingUsers = await db.select().from(users).limit(1)
  let demoUserId = existingUsers[0]?.id

  if (!demoUserId) {
    const hashedPassword = await bcrypt.hash('demo123', 12)
    const [newUser] = await db.insert(users).values({
      name: 'Demo Sales',
      email: 'demo@leadsense.ai',
      password: hashedPassword
    }).returning()
    demoUserId = newUser?.id
    console.log('✓ Demo user dibuat')
  } else {
    console.log('✓ User sudah ada, skip')
  }

  // Seed leads dengan data realistis — pre-analyzed (tanpa Claude API call)
  const demoLeads = [
    // === HOT (80-100) ===
    {
      name: 'Budi Santoso',
      rawMessage: 'Halo, saya mau book paket Raja Ampat untuk 4 orang, tanggal 15-22 Agustus 2026. Budget kami sekitar 20 juta per orang. Tolong kirim itinerary dan DP-nya ya.',
      source: 'WhatsApp',
      score: 95,
      status: 'Hot',
      destination: 'Raja Ampat',
      budget: 'Rp 20.000.000/orang',
      travelDate: '15-22 Agustus 2026',
      paxCount: 4,
      aiAnalysis: 'Lead sangat berkualitas tinggi. Budget jelas (Rp 20 juta/orang), tanggal spesifik, jumlah peserta fix 4 orang, dan sudah meminta DP — menunjukkan intent booking yang sangat kuat. Urgensi tinggi karena sudah menentukan tanggal perjalanan.',
      aiReplyDraft: 'Halo Budi! Terima kasih sudah menghubungi kami. Senang sekali mendengar rencana perjalanan Anda ke Raja Ampat! Untuk 4 orang tanggal 15-22 Agustus 2026 dengan budget Rp 20 juta/orang, kami memiliki paket premium yang sangat cocok. Saya akan segera mengirimkan itinerary lengkap beserta informasi DP dalam 1 jam ke depan. Boleh saya konfirmasi nomor WhatsApp Anda untuk pengiriman detail?'
    },
    {
      name: 'Siti Rahma',
      rawMessage: 'Mau honeymoon ke Maldives bulan September minggu pertama. Berdua aja. Budget all-in 50 juta sudah termasuk tiket. Ada paket overwater bungalow ga?',
      source: 'Instagram',
      score: 92,
      status: 'Hot',
      destination: 'Maldives',
      budget: 'Rp 50.000.000 all-in',
      travelDate: 'Minggu pertama September 2026',
      paxCount: 2,
      aiAnalysis: 'Lead honeymoon dengan budget yang sangat jelas dan spesifik (Rp 50 juta all-in). Periode perjalanan sudah ditentukan, menanyakan paket spesifik (overwater bungalow) yang menunjukkan riset serius. Kemungkinan besar sudah membandingkan beberapa travel agent.',
      aiReplyDraft: 'Selamat atas rencana honeymoon Anda, Siti! Maldives adalah pilihan yang sempurna untuk momen spesial ini. Untuk berdua di minggu pertama September dengan budget Rp 50 juta all-in, kami punya paket overwater bungalow di resort bintang 5 yang bisa masuk dalam budget tersebut. Termasuk tiket PP, transfer speedboat, dan sarapan. Boleh saya kirimkan 2-3 pilihan resort untuk Anda bandingkan?'
    },
    {
      name: 'Keluarga Wijaya',
      rawMessage: 'Kami keluarga 6 orang (2 dewasa, 4 anak usia 5-14 tahun) mau liburan ke Bali akhir tahun. Tanggal 27 Des - 2 Jan. Budget 40 juta untuk semuanya. Butuh villa private pool.',
      source: 'Website',
      score: 88,
      status: 'Hot',
      destination: 'Bali',
      budget: 'Rp 40.000.000 total',
      travelDate: '27 Desember 2026 - 2 Januari 2027',
      paxCount: 6,
      aiAnalysis: 'Lead keluarga besar dengan tanggal perjalanan sangat spesifik di musim liburan peak season. Budget jelas, komposisi peserta detail, dan kebutuhan spesifik (villa private pool). Akhir tahun adalah periode permintaan tinggi sehingga closing cepat krusial.',
      aiReplyDraft: 'Halo! Paket liburan keluarga ke Bali akhir tahun terdengar luar biasa! Untuk 6 orang (2 dewasa + 4 anak) tanggal 27 Des - 2 Jan dengan budget Rp 40 juta, kami bisa carikan villa private pool yang nyaman untuk seluruh keluarga. Perlu kami informasikan bahwa periode akhir tahun sangat ramai, jadi ketersediaan villa terbatas. Boleh kami proses konfirmasi awal dulu hari ini?'
    },
    // === WARM (50-79) ===
    {
      name: 'Andi Pratama',
      rawMessage: 'Pengen ke Labuan Bajo bulan Oktober atau November, belum pasti tanggalnya. Berempat sama teman-teman. Kira-kira budget berapa ya untuk paket 5 hari?',
      source: 'WhatsApp',
      score: 65,
      status: 'Warm',
      destination: 'Labuan Bajo',
      budget: null,
      travelDate: 'Oktober atau November 2026',
      paxCount: 4,
      aiAnalysis: 'Lead dengan destinasi jelas dan jumlah peserta fix, namun tanggal masih belum pasti dan budget belum ada. Menanyakan estimasi harga menunjukkan minat serius untuk perencanaan. Perlu follow-up untuk konfirmasi tanggal dan ekspektasi budget.',
      aiReplyDraft: 'Hai Andi! Labuan Bajo pilihan yang tepat untuk trip bersama teman! Untuk 4 orang paket 5 hari ke Labuan Bajo, estimasi budget berkisar Rp 7-12 juta/orang tergantung pilihan kapal dan hotel. Untuk Oktober lebih ramai, November biasanya lebih sepi dan harga sedikit lebih terjangkau. Kalian lebih prefer yang mana? Biar kami bisa siapkan penawaran yang pas!'
    },
    {
      name: 'Maya Putri',
      rawMessage: 'Mau solo trip ke Jepang musim semi tahun depan untuk lihat sakura. Belum terlalu paham mau ke kota mana saja. Budget sekitar 15-20 juta termasuk tiket. Bisa bantu itinerary?',
      source: 'Email',
      score: 60,
      status: 'Warm',
      destination: 'Jepang',
      budget: 'Rp 15.000.000 - 20.000.000',
      travelDate: 'Musim semi 2027 (Maret-April)',
      paxCount: 1,
      aiAnalysis: 'Lead solo trip dengan range budget yang jelas dan periode musiman yang spesifik (musim semi/sakura). Belum tahu itinerary menunjukkan masih di fase eksplorasi, namun menanyakan bantuan itinerary menunjukkan niat serius. Perlu diedukasi tentang kota-kota sakura terbaik.',
      aiReplyDraft: 'Wah, solo trip ke Jepang untuk lihat sakura impian banyak orang! Untuk budget Rp 15-20 juta, kita bisa cakup Tokyo, Kyoto, dan Osaka — tiga kota terbaik untuk sakura. Sakura biasanya mekar akhir Maret - awal April. Saya sarankan book tiket dari sekarang karena musim sakura sangat ramai. Mau saya buatkan sample itinerary 10 hari dulu untuk gambaran?'
    },
    {
      name: 'Reza Firmansyah',
      rawMessage: 'Tertarik paket umrah plus wisata Turki. Buat keluarga 3 orang, rencananya tahun ini kalau ada slot. Berapa harganya?',
      source: 'WhatsApp',
      score: 55,
      status: 'Warm',
      destination: 'Arab Saudi + Turki',
      budget: null,
      travelDate: '2026',
      paxCount: 3,
      aiAnalysis: 'Lead paket kombinasi umrah-wisata yang niche dan bernilai tinggi. Jumlah peserta jelas (3 orang), namun tanggal masih umum (tahun ini) dan budget belum disebutkan. Menanyakan harga langsung menunjukkan minat konkret. Perlu follow-up untuk cek ketersediaan slot dan diskusi budget.',
      aiReplyDraft: 'Assalamualaikum! Paket Umrah Plus Turki untuk 3 orang adalah pilihan yang luar biasa. Untuk tahun ini kami masih punya beberapa slot tersisa. Harga paket 12 hari (Umrah 5 hari + Turki 7 hari) mulai dari Rp 28 juta/orang sudah termasuk visa, hotel, dan guide. Kapan kira-kira Anda ingin berangkat? Kami bisa bantu cek ketersediaan slot segera.'
    },
    // === COLD (20-49) ===
    {
      name: 'Dini Kusuma',
      rawMessage: 'Halo, nanya dong. Kalau mau ke Lombok itu enaknya kapan? Dan kira-kira biayanya berapa? Masih lama sih rencananya, mungkin tahun depan.',
      source: 'Instagram',
      score: 35,
      status: 'Cold',
      destination: 'Lombok',
      budget: null,
      travelDate: 'Tahun depan (2027)',
      paxCount: null,
      aiAnalysis: 'Lead masih sangat awal dalam proses perencanaan — belum tahu kapan, berapa orang, dan berapa budget. Waktu perjalanan masih sangat jauh (tahun depan). Cocok untuk nurturing konten edukasi daripada closing langsung.',
      aiReplyDraft: 'Hai Dini! Lombok memang destinasi yang indah. Waktu terbaik ke Lombok adalah April-Oktober saat musim kemarau — pantai jernih dan ombak bersahabat. Untuk budget, paket 3-5 hari biasanya mulai Rp 3-8 juta/orang tergantung jumlah peserta dan jenis akomodasi. Mau kami kirimkan katalog paket Lombok lengkap untuk referensi perencanaanmu?'
    },
    {
      name: 'Tono Haryadi',
      rawMessage: 'Permisi, minta info paket wisata domestik donk. Kami belum punya destinasi spesifik, mau lihat-lihat dulu pilihan yang ada.',
      source: 'Website',
      score: 25,
      status: 'Cold',
      destination: null,
      budget: null,
      travelDate: null,
      paxCount: null,
      aiAnalysis: 'Lead sangat awal — tidak ada informasi spesifik: destinasi, tanggal, jumlah orang, maupun budget. Masih dalam fase window shopping. Prioritas rendah untuk follow-up langsung, lebih cocok dikirimkan katalog dan konten inspirasi.',
      aiReplyDraft: 'Halo Tono! Dengan senang hati kami membantu. Kami punya banyak pilihan destinasi wisata domestik yang indah, mulai dari Bali, Lombok, Raja Ampat, Labuan Bajo, Wakatobi, hingga Bromo dan Ijen. Boleh kami tahu kira-kira Anda tertarik dengan tipe wisata seperti apa? (pantai, alam, budaya, atau petualangan?) Agar kami bisa rekomendasikan yang paling sesuai!'
    },
    // === NURTURE (0-19) ===
    {
      name: 'Lina Anggraini',
      rawMessage: 'Halo kak, lihat-lihat aja dulu ya. Nanti kalau ada info promo tolong kabarin. Makasih',
      source: 'Instagram',
      score: 10,
      status: 'Nurture',
      destination: null,
      budget: null,
      travelDate: null,
      paxCount: null,
      aiAnalysis: 'Lead pasif tanpa niat pembelian yang jelas saat ini. Hanya ingin mendapatkan informasi promo. Tidak ada indikator urgensi, budget, destinasi, maupun waktu perjalanan. Masukkan ke email newsletter untuk nurturing jangka panjang.',
      aiReplyDraft: 'Halo Lina! Tentu, kami akan inform kalau ada promo menarik. Untuk dapat update promo pertama, boleh kami minta email Anda? Kami juga rutin share tips travel dan inspirasi destinasi di Instagram kami. Semoga segera ada rencana perjalanan seru untukmu!'
    },
    {
      name: 'Bagas Nugroho',
      rawMessage: 'Penasaran aja sih sama paket wisata luar negeri itu gimana ya cara kerjanya. Masih kuliah jadi belum bisa jalan-jalan dulu hehe.',
      source: 'Website',
      score: 5,
      status: 'Nurture',
      destination: null,
      budget: null,
      travelDate: null,
      paxCount: null,
      aiAnalysis: 'Lead mahasiswa yang baru ingin tahu tentang cara kerja paket wisata, belum ada rencana perjalanan konkret. Tidak ada urgensi, budget, atau timeline yang jelas. Potensial untuk masa depan — masukkan ke email sequence edukasi.',
      aiReplyDraft: 'Hai Bagas! Senang kamu tertarik! Cara kerja paket wisata luar negeri itu kita bantu dari A sampai Z: visa, tiket, hotel, itinerary, hingga guide lokal. Nanti kalau sudah siap jalan-jalan, kami siap membantu wujudkan tripmu. Mau kami kirimkan panduan "Cara Plan Trip Luar Negeri Pertama" gratis?'
    }
  ]

  await db.insert(leads).values(demoLeads.map(lead => ({
    ...lead,
    updatedAt: new Date()
  })))

  console.log(`✓ ${demoLeads.length} leads berhasil di-seed`)
  console.log('')
  console.log('📊 Summary:')
  console.log(`   Hot     : ${demoLeads.filter(l => l.status === 'Hot').length} leads`)
  console.log(`   Warm    : ${demoLeads.filter(l => l.status === 'Warm').length} leads`)
  console.log(`   Cold    : ${demoLeads.filter(l => l.status === 'Cold').length} leads`)
  console.log(`   Nurture : ${demoLeads.filter(l => l.status === 'Nurture').length} leads`)
  console.log('')
  console.log('✅ Seed selesai! Siap untuk demo.')
}

seed().catch((err) => {
  console.error('❌ Seed gagal:', err)
  process.exit(1)
})
