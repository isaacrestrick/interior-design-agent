import { NextResponse } from 'next/server';
import { sampleWallId } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ wallId: sampleWallId });
}
