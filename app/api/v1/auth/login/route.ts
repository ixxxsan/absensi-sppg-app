import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, idRelawan } = body;

    // TODO: Implement actual database validation here
    // Mock response
    if (email === 'admin@sppg.id' || idRelawan === 'admin') {
      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: 999,
            namaLengkap: 'Administrator',
            email: 'admin@sppg.id',
            role: 'admin',
          },
          token: 'dummy_admin_token_xyz',
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: 1,
          idRelawan: idRelawan || 'SPPG-001',
          namaLengkap: 'Budi Santoso',
          email: email || 'budi@sppg.id',
          role: 'relawan',
          divisi: 'ASISTEN LAPANGAN',
          status: 'Aktif'
        },
        token: 'dummy_relawan_token_abc',
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Invalid request payload' }, { status: 400 });
  }
}
