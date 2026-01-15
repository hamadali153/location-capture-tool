import { NextResponse } from 'next/server';
import { createSession, setSessionCookie } from '@/lib/auth';
import { verifyAuthenticationCredential } from '@/lib/webauthn';

// Verify fingerprint authentication
export async function POST(request: Request) {
    try {
        const { credential, adminId } = await request.json();

        if (!adminId) {
            return NextResponse.json({ error: 'Admin ID required' }, { status: 400 });
        }

        const result = await verifyAuthenticationCredential(adminId, credential);

        if (result.verified) {
            const token = createSession(adminId);
            await setSessionCookie(token);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    } catch (error) {
        console.error('Auth verify error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
}
