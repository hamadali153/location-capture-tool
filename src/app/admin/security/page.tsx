'use client';
import { useState, useEffect } from 'react';
import { Fingerprint, Plus, Trash2, Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';

interface Credential {
    id: string;
    deviceName: string;
    createdAt: string;
}

export default function SecurityPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [deviceName, setDeviceName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/session');
            const data = await res.json();

            if (!data.authenticated) {
                router.push('/login');
                return;
            }

            setCredentials(data.credentials || []);
        } catch (error) {
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterFingerprint = async () => {
        if (!deviceName.trim()) {
            setMessage({ type: 'error', text: 'Please enter a device name' });
            return;
        }

        setRegistering(true);
        setMessage(null);
        setShowNameModal(false);

        try {
            // Get registration options
            const optionsRes = await fetch('/api/auth/webauthn/register/options');
            if (!optionsRes.ok) {
                throw new Error('Failed to get registration options');
            }

            const options = await optionsRes.json();

            // Start fingerprint registration
            const credential = await startRegistration({ optionsJSON: options });

            // Verify and save
            const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential, deviceName: deviceName.trim() })
            });

            if (verifyRes.ok) {
                setMessage({ type: 'success', text: 'Fingerprint registered successfully!' });
                setDeviceName('');
                checkAuth(); // Refresh credentials list
            } else {
                throw new Error('Verification failed');
            }
        } catch (error: any) {
            if (error.name === 'NotAllowedError') {
                setMessage({ type: 'error', text: 'Registration cancelled or not allowed' });
            } else if (error.name === 'InvalidStateError') {
                setMessage({ type: 'error', text: 'This fingerprint is already registered' });
            } else {
                setMessage({ type: 'error', text: 'Failed to register fingerprint' });
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleDeleteCredential = async (credentialId: string) => {
        if (!confirm('Are you sure you want to remove this fingerprint?')) return;

        try {
            const res = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Fingerprint removed' });
                checkAuth();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to remove fingerprint' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.push('/admin')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Shield size={28} className="text-purple-400" />
                            Security Settings
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">Manage fingerprint authentication</p>
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`
                        flex items-center gap-2 p-4 rounded-xl mb-6
                        ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : ''}
                        ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                    `}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Fingerprints Section */}
                <div className="bg-[#121215] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Fingerprint size={20} className="text-purple-400" />
                            Registered Fingerprints
                        </h2>
                        <button
                            onClick={() => setShowNameModal(true)}
                            disabled={registering}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            <Plus size={18} />
                            Add Fingerprint
                        </button>
                    </div>

                    {credentials.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <Fingerprint size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No fingerprints registered yet</p>
                            <p className="text-sm mt-1">Add a fingerprint for faster login</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {credentials.map((cred) => (
                                <div
                                    key={cred.id}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                            <Fingerprint size={20} className="text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{cred.deviceName || 'Unnamed Device'}</p>
                                            <p className="text-xs text-gray-500">
                                                Added {new Date(cred.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCredential(cred.id)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-sm text-blue-300">
                        <strong>Security Note:</strong> Fingerprints can only be registered while logged in with your PIN.
                        This ensures only authorized administrators can add new authentication methods.
                    </p>
                </div>
            </div>

            {/* Device Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Name This Device</h3>
                        <input
                            type="text"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            placeholder="e.g., MacBook Pro, iPhone 15"
                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 mb-4 outline-none focus:border-purple-500/50"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowNameModal(false); setDeviceName(''); }}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRegisterFingerprint}
                                disabled={!deviceName.trim() || registering}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {registering ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <Fingerprint size={18} />
                                        Register
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
