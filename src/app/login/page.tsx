'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Lock, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
    const router = useRouter();
    const [pin, setPin] = useState(['', '', '', '']);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [hasFingerprint, setHasFingerprint] = useState(false);
    const [checkingFingerprint, setCheckingFingerprint] = useState(true);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if fingerprint is available
    useEffect(() => {
        checkFingerprintAvailability();
    }, []);

    const checkFingerprintAvailability = async () => {
        try {
            const res = await fetch('/api/auth/webauthn/authenticate/options');
            setHasFingerprint(res.ok);
        } catch {
            setHasFingerprint(false);
        } finally {
            setCheckingFingerprint(false);
        }
    };

    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (newPin.every(d => d !== '') && newPin.join('').length === 4) {
            handlePinLogin(newPin.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePinLogin = async (pinCode: string) => {
        setStatus('loading');
        setMessage('Verifying PIN...');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pinCode })
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(data.isFirstLogin ? 'Welcome! Redirecting to setup...' : 'Access granted');
                setTimeout(() => router.push('/admin'), 1000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Invalid PIN');
                setPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            setStatus('error');
            setMessage('Connection error');
            setPin(['', '', '', '']);
        }
    };

    const handleFingerprintLogin = async () => {
        setStatus('loading');
        setMessage('Waiting for fingerprint...');

        try {
            // Get authentication options
            const optionsRes = await fetch('/api/auth/webauthn/authenticate/options');
            if (!optionsRes.ok) {
                throw new Error('Failed to get options');
            }

            const { options, adminId } = await optionsRes.json();

            // Start fingerprint authentication
            const credential = await startAuthentication({ optionsJSON: options });

            // Verify with server
            const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential, adminId })
            });

            if (verifyRes.ok) {
                setStatus('success');
                setMessage('Fingerprint verified');
                setTimeout(() => router.push('/admin'), 1000);
            } else {
                throw new Error('Verification failed');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.name === 'NotAllowedError' ? 'Fingerprint cancelled' : 'Fingerprint failed');
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-30%] right-[-20%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                        <Shield size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-gray-500 mt-1 text-sm">Enter your 4-digit PIN</p>
                </div>

                {/* PIN Input */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-8">
                    <div className="flex justify-center gap-3 mb-6">
                        {pin.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="password"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePinChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={status === 'loading' || status === 'success'}
                                className={`
                                    w-14 h-16 text-center text-2xl font-bold rounded-xl
                                    bg-black/50 border-2 outline-none transition-all
                                    ${status === 'error' ? 'border-red-500/50 animate-shake' : 'border-white/10 focus:border-blue-500/50'}
                                    ${digit ? 'text-white' : 'text-gray-600'}
                                `}
                                autoFocus={index === 0}
                            />
                        ))}
                    </div>

                    {/* Status Message */}
                    {message && (
                        <div className={`
                            flex items-center justify-center gap-2 py-3 px-4 rounded-lg mb-6
                            ${status === 'error' ? 'bg-red-500/10 text-red-400' : ''}
                            ${status === 'success' ? 'bg-green-500/10 text-green-400' : ''}
                            ${status === 'loading' ? 'bg-blue-500/10 text-blue-400' : ''}
                        `}>
                            {status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                            {status === 'success' && <CheckCircle size={16} />}
                            {status === 'error' && <AlertCircle size={16} />}
                            <span className="text-sm font-medium">{message}</span>
                        </div>
                    )}

                    {/* Fingerprint Button */}
                    {!checkingFingerprint && hasFingerprint && (
                        <div className="border-t border-white/10 pt-6">
                            <button
                                onClick={handleFingerprintLogin}
                                disabled={status === 'loading' || status === 'success'}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-500/30 rounded-xl transition-all group"
                            >
                                <Fingerprint size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-white font-medium">Use Fingerprint</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6 flex items-center justify-center gap-1">
                    <Lock size={10} />
                    Secured with end-to-end encryption
                </p>
            </div>

            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>
        </div>
    );
}
