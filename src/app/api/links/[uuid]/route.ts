import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;

    try {
        const link = await prisma.link.findUnique({
            where: { uuid },
            select: {
                id: true,
                uuid: true,
                title: true,
                imageData: true,
                createdAt: true
            }
        });

        if (!link) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: link.id,
            uuid: link.uuid,
            title: link.title,
            hasImage: link.imageData !== null,
            created_at: link.createdAt
        });
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
