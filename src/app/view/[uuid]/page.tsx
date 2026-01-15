import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import ViewClient from './ViewClient';

export default async function ViewPage({ params }: { params: Promise<{ uuid: string }> }) {
    const { uuid } = await params;

    const link = await prisma.link.findUnique({
        where: { uuid },
        select: {
            id: true,
            uuid: true,
            title: true,
            imageData: true,
            createdAt: true
        }
    });

    if (!link) {
        notFound();
    }

    // Map to match the prop types expected by ViewClient
    const mappedLink = {
        id: link.id,
        uuid: link.uuid,
        title: link.title,
        hasImage: link.imageData !== null,
        created_at: link.createdAt
    };

    return <ViewClient link={mappedLink} uuid={uuid} />;
}
