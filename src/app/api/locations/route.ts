import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { link_uuid, latitude, longitude, accuracy, user_agent } = await request.json();

        // Get IP from headers
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // Find Link
        const link = await prisma.link.findUnique({
            where: { uuid: link_uuid }
        });

        if (!link) {
            return NextResponse.json({ error: 'Link not found' }, { status: 404 });
        }

        // Create Location
        const location = await prisma.location.create({
            data: {
                linkId: link.id,
                latitude: latitude || null,
                longitude: longitude || null,
                accuracy: accuracy || null,
                userAgent: user_agent,
                ipAddress: ipAddress
            }
        });

        return NextResponse.json(location);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
