// app/api/demo/farmers/route.ts
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { FarmerProfile } from '../../../../types';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'demo-data');
    const filenames = ['wanjiku.json', 'joseph.json', 'amina.json'];

    const farmers: FarmerProfile[] = [];

    for (const filename of filenames) {
      const filePath = path.join(dataDir, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');
      farmers.push(JSON.parse(fileContent));
    }

    return NextResponse.json({ farmers }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to load demo farmers:', error);
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: 'Could not load demo farmer profiles.',
        },
      },
      { status: 500 }
    );
  }
}
