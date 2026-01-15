import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateAuthenticationOptionsForAdmin } from '@/lib/webauthn';

// Generate authentication options for fingerprint login
export async function GET() {
    try {
        // Get the admin (single admin system)
        const admin = await prisma.admin.findFirst({
            include: { credentials: true }
        });

        if (!admin) {
            return NextResponse.json({ error: 'No admin configured' }, { status: 404 });
        }

        if (admin.credentials.length === 0) {
            return NextResponse.json({ error: 'No fingerprints registered' }, { status: 404 });
        }

        const options = await generateAuthenticationOptionsForAdmin(admin.id);

        if (!options) {
            return NextResponse.json({ error: 'No credentials available' }, { status: 404 });
        }

        return NextResponse.json({ options, adminId: admin.id });
    } catch (error) {
        console.error('Auth options error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
