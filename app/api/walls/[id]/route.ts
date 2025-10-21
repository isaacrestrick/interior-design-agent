export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wall = db.getWallWithFixtures(id);

    if (!wall) {
      return NextResponse.json(
        { error: 'Wall not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(wall);
  } catch (error) {
    console.error('Error fetching wall:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wall' },
      { status: 500 }
    );
  }
}
