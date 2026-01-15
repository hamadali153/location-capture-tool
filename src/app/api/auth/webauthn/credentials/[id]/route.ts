import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { deleteCredential } from '@/lib/webauthn';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const adminId = await getAuthenticatedAdmin();

        if (!adminId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await deleteCredential(adminId, id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete credential error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 400 });
    }
}
