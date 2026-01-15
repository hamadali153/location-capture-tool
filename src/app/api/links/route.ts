import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const image = formData.get('image') as File | null;

        let imageData: Buffer | null = null;
        let imageMimeType: string | null = null;

        if (image && image.size > 0) {
            const arrayBuffer = await image.arrayBuffer();
            imageData = Buffer.from(arrayBuffer);
            imageMimeType = image.type || 'image/jpeg';
        }

        const link = await prisma.link.create({
            data: {
                title,
                imageData,
                imageMimeType
            }
        });

        return NextResponse.json(link);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const links = await prisma.link.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                uuid: true,
                title: true,
                createdAt: true,
                imageData: true, // We need this to check if image exists
            }
        });

        // Map to include hasImage flag without returning actual binary data
        const linksWithImageFlag = links.map(link => ({
            id: link.id,
            uuid: link.uuid,
            title: link.title,
            createdAt: link.createdAt,
            hasImage: link.imageData !== null
        }));

        return NextResponse.json(linksWithImageFlag);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
