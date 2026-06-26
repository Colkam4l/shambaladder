// app/api/share/[shareId]/route.ts
import { NextResponse } from 'next/server';
import { shareStore } from '../../../../lib/share-store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'shareId is required.',
          },
        },
        { status: 400 }
      );
    }

    const sharedProfile = shareStore.get(shareId);

    if (!sharedProfile) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Shared profile not found or access has been revoked.',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ sharedProfile }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching shared profile:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'An internal error occurred while fetching the shared profile.',
        },
      },
      { status: 500 }
    );
  }
}
