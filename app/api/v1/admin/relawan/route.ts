import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // TODO: Implement pagination, search, and fetch from database
  
  return NextResponse.json({
    success: true,
    data: [
      { id: 1, idRelawan: 'SPPG-001', namaLengkap: 'Budi Santoso', status_aktif: true },
      { id: 2, idRelawan: 'SPPG-002', namaLengkap: 'Siti Rahayu', status_aktif: true },
    ]
  });
}

export async function POST(request: Request) {
  // Create new relawan
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Relawan berhasil ditambahkan', data: body });
}

export async function PUT(request: Request) {
  // Update relawan
  const body = await request.json();
  return NextResponse.json({ success: true, message: 'Data relawan berhasil diupdate' });
}
