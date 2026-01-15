import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse,
    VerifiedRegistrationResponse
} from '@simplewebauthn/server';
import type {
    RegistrationResponseJSON,
    AuthenticationResponseJSON
} from '@simplewebauthn/browser';
import prisma from './db';

// WebAuthn configuration
const rpName = 'Location Capture Admin';
const rpID = process.env.WEBAUTHN_RP_ID || 'localhost';
const origin = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

// Challenge store that persists across hot reloads in development
const globalForChallenge = globalThis as unknown as {
    webauthnChallengeStore: Map<number, string>
};

const challengeStore = globalForChallenge.webauthnChallengeStore || new Map<number, string>();

if (process.env.NODE_ENV !== 'production') {
    globalForChallenge.webauthnChallengeStore = challengeStore;
}

export async function generateRegistrationOptionsForAdmin(adminId: number) {
    const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        include: { credentials: true }
    });

    if (!admin) throw new Error('Admin not found');

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: new TextEncoder().encode(adminId.toString()),
        userName: `admin-${adminId}`,
        userDisplayName: 'Administrator',
        attestationType: 'none',
        excludeCredentials: admin.credentials.map(cred => ({
            id: cred.id,
            transports: ['internal'] as AuthenticatorTransport[]
        })),
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // Built-in authenticators only (fingerprint, face ID)
            userVerification: 'required',
            residentKey: 'preferred'
        }
    });

    // Store challenge for verification
    challengeStore.set(adminId, options.challenge);

    return options;
}

export async function verifyAndSaveCredential(
    adminId: number,
    response: RegistrationResponseJSON,
    deviceName?: string
) {
    const expectedChallenge = challengeStore.get(adminId);
    if (!expectedChallenge) throw new Error('Challenge not found or expired');

    const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID
    });

    if (!verification.verified || !verification.registrationInfo) {
        throw new Error('Verification failed');
    }

    const { credential } = verification.registrationInfo;

    // The public key is inside the credential object in newer versions
    const publicKey = credential.publicKey;

    if (!publicKey) {
        throw new Error('Public key not found in credential');
    }

    // Save credential to database
    await prisma.webAuthnCredential.create({
        data: {
            id: credential.id,
            adminId,
            publicKey: Buffer.from(publicKey),
            counter: credential.counter,
            deviceName: deviceName || 'Fingerprint Device'
        }
    });

    // Clear challenge
    challengeStore.delete(adminId);

    return { verified: true };
}

export async function generateAuthenticationOptionsForAdmin(adminId: number) {
    const credentials = await prisma.webAuthnCredential.findMany({
        where: { adminId }
    });

    if (credentials.length === 0) {
        return null; // No credentials registered
    }

    const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials: credentials.map(cred => ({
            id: cred.id,
            transports: ['internal'] as AuthenticatorTransport[]
        })),
        userVerification: 'required'
    });

    challengeStore.set(adminId, options.challenge);

    return options;
}

export async function verifyAuthenticationCredential(
    adminId: number,
    response: AuthenticationResponseJSON
) {
    const expectedChallenge = challengeStore.get(adminId);
    if (!expectedChallenge) throw new Error('Challenge not found or expired');

    const credential = await prisma.webAuthnCredential.findUnique({
        where: { id: response.id }
    });

    if (!credential || credential.adminId !== adminId) {
        throw new Error('Credential not found');
    }

    const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
            id: credential.id,
            publicKey: new Uint8Array(credential.publicKey),
            counter: credential.counter
        }
    });

    if (verification.verified) {
        // Update counter to prevent replay attacks
        await prisma.webAuthnCredential.update({
            where: { id: credential.id },
            data: { counter: verification.authenticationInfo.newCounter }
        });

        challengeStore.delete(adminId);
    }

    return { verified: verification.verified };
}

export async function getAdminCredentials(adminId: number) {
    return prisma.webAuthnCredential.findMany({
        where: { adminId },
        select: {
            id: true,
            deviceName: true,
            createdAt: true
        }
    });
}

export async function deleteCredential(adminId: number, credentialId: string) {
    const credential = await prisma.webAuthnCredential.findUnique({
        where: { id: credentialId }
    });

    if (!credential || credential.adminId !== adminId) {
        throw new Error('Credential not found or unauthorized');
    }

    await prisma.webAuthnCredential.delete({
        where: { id: credentialId }
    });

    return { deleted: true };
}
