// app/api/share/route.ts
import { NextResponse } from 'next/server';
import { shareStore } from '../../../lib/share-store';
import { SharedProfile } from '../../../types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { farmerId, lenderName, scoreSnapshot, explanationSnapshot, profileSnapshot } = body;

    if (!farmerId || !scoreSnapshot || !explanationSnapshot || !profileSnapshot) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'farmerId, scoreSnapshot, explanationSnapshot, and profileSnapshot are required.',
          },
        },
        { status: 400 }
      );
    }

    const shareId = crypto.randomUUID();
    const expiresAt = null; // No expiry for hackathon

    // Build the SharedProfile object
    const sharedProfile: SharedProfile = {
      shareId,
      farmerId,
      lenderName: lenderName || null,
      sharedAt: new Date().toISOString(),
      expiresAt,
      scoreSnapshot,
      explanationSnapshot,
      profileSnapshot,
    };

    // Store in global memory map
    shareStore.set(shareId, sharedProfile);

    // Compute the share URL (use relative or environment base url)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/lender/scorecard/${shareId}`;

    return NextResponse.json(
      {
        shareId,
        shareUrl,
        expiresAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating profile share:', error);
    return NextResponse.json(
      {
        error: {
          code: 'STORAGE_FAILED',
          message: 'Could not persist share snapshot.',
        },
      },
      { status: 500 }
    );
  }
}
