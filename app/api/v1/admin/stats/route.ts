import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // TODO: Verify Admin Token
  
  // Mock Data
  return NextResponse.json({
    success: true,
    data: {
      totalRelawan: 120,
      hadirHariIni: 105,
      absenDitolak: 2,
      belumAbsen: 13,
      recentActivity: [
        { nama: 'Budi Santoso', tipe: 'masuk', waktu: '07:30', status: 'valid' },
        { nama: 'Siti Rahayu', tipe: 'masuk', waktu: '07:35', status: 'valid' }
      ]
    }
  });
}
