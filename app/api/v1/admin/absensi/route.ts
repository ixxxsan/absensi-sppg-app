import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // TODO: Fetch from database, filter by date
  
  return NextResponse.json({
    success: true,
    data: [
      {
        id: 1,
        relawan: { namaLengkap: 'Budi Santoso', idRelawan: 'SPPG-001' },
        tipe: 'masuk',
        waktuAbsen: '07:30',
        statusValidasi: 'menunggu',
        fotoUrl: 'https://example.com/foto1.jpg',
        latitude: -6.200000,
        longitude: 106.816666
      }
    ]
  });
}

export async function PUT(request: Request) {
  // Update status validasi (Approve / Reject)
  const body = await request.json();
  const { id, statusValidasi } = body;
  
  return NextResponse.json({
    success: true,
    message: `Absensi berhasil di-set menjadi ${statusValidasi}`
  });
}
