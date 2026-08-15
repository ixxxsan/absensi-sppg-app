import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  // TODO: Query database for records between dates
  // Generate Excel file buffer (using xlsx library)
  // Return file as response
  
  return NextResponse.json({
    success: true,
    message: `Endpoint export excel untuk rentang ${startDate} s/d ${endDate}. Nantinya akan mereturn file .xlsx`
  });
}
