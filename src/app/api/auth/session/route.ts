import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
    try {
        const adminId = await getAuthenticatedAdmin();

        if (!adminId) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            include: { credentials: { select: { id: true, deviceName: true, createdAt: true } } }
        });

        if (!admin) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            hasFingerprint: admin.credentials.length > 0,
            credentials: admin.credentials
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
