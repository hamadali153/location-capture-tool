import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'location-capture-super-secret-key-change-in-production';
const COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days in seconds

export async function hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
}

export function createSession(adminId: number): string {
    return jwt.sign(
        { adminId, iat: Math.floor(Date.now() / 1000) },
        JWT_SECRET,
        { expiresIn: SESSION_DURATION }
    );
}

export function verifySession(token: string): { adminId: number } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { adminId: number };
        return decoded;
    } catch {
        return null;
    }
}

export async function setSessionCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION,
        path: '/'
    });
}

export async function getSessionCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getAuthenticatedAdmin(): Promise<number | null> {
    const token = await getSessionCookie();
    if (!token) return null;

    const session = verifySession(token);
    return session?.adminId || null;
}
