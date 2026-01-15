import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        const locations = await prisma.location.findMany({
            where: { linkId: parseInt(id) },
            orderBy: { timestamp: 'desc' }
        });
        return NextResponse.json(locations);
    } catch (error) {
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
