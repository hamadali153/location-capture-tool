import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const count = await prisma.location.count();
        return NextResponse.json({ count });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
