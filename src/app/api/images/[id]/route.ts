import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const link = await prisma.link.findUnique({
            where: { id: parseInt(id) },
            select: {
                imageData: true,
                imageMimeType: true
            }
        });

        if (!link || !link.imageData) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Convert Prisma Bytes to Buffer and return as image
        const imageBuffer = Buffer.from(link.imageData);

        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': link.imageMimeType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable'
            }
        });
    } catch (error) {
        console.error('Error fetching image:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
