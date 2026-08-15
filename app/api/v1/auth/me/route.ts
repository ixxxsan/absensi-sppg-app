import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // TODO: Verify Authorization Bearer token here
  // For now, return a mock success
  
  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: 1,
        idRelawan: 'SPPG-001',
        namaLengkap: 'Budi Santoso',
        email: 'budi@sppg.id',
        role: 'relawan',
      }
    }
  });
}
