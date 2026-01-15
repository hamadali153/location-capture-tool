import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { generateRegistrationOptionsForAdmin } from '@/lib/webauthn';

// Generate registration options - ONLY for authenticated admins
export async function GET() {
    try {
        const adminId = await getAuthenticatedAdmin();

        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized - must be logged in with PIN first' }, { status: 401 });
        }

        const options = await generateRegistrationOptionsForAdmin(adminId);

        return NextResponse.json(options);
    } catch (error) {
        console.error('Registration options error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
