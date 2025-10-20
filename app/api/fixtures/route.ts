import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      type,
      name,
      widthInches,
      heightInches,
      positionX,
      positionY,
      wallId,
      productUrl,
      notes,
    } = body;

    // Validate required fields
    if (!type || !name || !widthInches || !heightInches || positionX === undefined || positionY === undefined || !wallId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fixture = db.createFixture({
      type,
      name,
      widthInches: parseFloat(widthInches),
      heightInches: parseFloat(heightInches),
      positionX: parseFloat(positionX),
      positionY: parseFloat(positionY),
      wallId,
      productUrl,
      notes,
    });

    return NextResponse.json(fixture, { status: 201 });
  } catch (error) {
    console.error('Error creating fixture:', error);
    return NextResponse.json(
      { error: 'Failed to create fixture' },
      { status: 500 }
    );
  }
}
