import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPin, createSession, setSessionCookie, hashPin } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { pin } = await request.json();

        if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            return NextResponse.json({ error: 'Invalid PIN format' }, { status: 400 });
        }

        // Get admin (we only have one admin in this system)
        let admin = await prisma.admin.findFirst();

        // If no admin exists, create one with this PIN (first-time setup)
        if (!admin) {
            const pinHash = await hashPin(pin);
            admin = await prisma.admin.create({
                data: { pinHash }
            });

            const token = createSession(admin.id);
            await setSessionCookie(token);

            return NextResponse.json({
                success: true,
                isFirstLogin: true,
                message: 'Admin created. Please set up fingerprint authentication.'
            });
        }

        // Verify PIN
        const isValid = await verifyPin(pin, admin.pinHash);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
        }

        const token = createSession(admin.id);
        await setSessionCookie(token);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
