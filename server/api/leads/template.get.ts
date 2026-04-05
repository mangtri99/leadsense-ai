export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const headers = ['name', 'message', 'source', 'email', 'phone']

  const examples = [
    [
      'Budi Santoso',
      'Halo, saya mau tanya paket wisata ke Bali untuk 4 orang. Rencananya tanggal 20-25 Juli. Budget sekitar 8 juta per orang. Mohon info hotelnya ya.',
      'WhatsApp',
      'budi.santoso@gmail.com',
      '081234567890'
    ],
    [
      'Siti Rahayu',
      'Selamat siang, saya tertarik dengan paket Lombok. Kami berdua, bulan Agustus. Budget fleksibel tapi prefer bintang 4. Ada promo?',
      'Instagram',
      'siti.rahayu@yahoo.com',
      '087654321098'
    ],
    [
      'Ahmad Fauzi',
      'Mau tanya dong, untuk trip ke Raja Ampat berapa ya? Kami 6 orang keluarga, mau snorkeling. Rencana liburan akhir tahun.',
      'Website',
      '',
      '082109876543'
    ]
  ]

  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = [
    headers.join(','),
    ...examples.map(row => row.map(escapeCSV).join(','))
  ]

  const csv = rows.join('\n')

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="leadsense-import-template.csv"')

  return csv
})
