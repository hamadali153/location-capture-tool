import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { verifyAndSaveCredential } from '@/lib/webauthn';

// Verify and save credential - ONLY for authenticated admins
export async function POST(request: Request) {
    try {
        const adminId = await getAuthenticatedAdmin();

        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized - must be logged in with PIN first' }, { status: 401 });
        }

        const { credential, deviceName } = await request.json();

        const result = await verifyAndSaveCredential(adminId, credential, deviceName);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Registration verify error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }
}
