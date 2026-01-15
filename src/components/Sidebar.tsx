'use client';
import { LayoutDashboard, PlusCircle, Link as LinkIcon, LogOut, Map, Activity, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Sidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) {
    const router = useRouter();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'create', label: 'Create Link', icon: PlusCircle },
        { id: 'links', label: 'My Links', icon: LinkIcon },
        { id: 'analytics', label: 'Analytics', icon: Activity },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#09090b]/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-50">
            {/* Brand */}
            <div className="p-6 border-b border-white/5">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                    <Map className="text-blue-500" />
                    GeoShare
                </h1>
                <p className="text-xs text-gray-500 mt-1">Advanced Location Intelligence</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }
              `}
                        >
                            <Icon size={20} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'} />
                            <span className="font-medium">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 space-y-2">
                <button
                    onClick={() => router.push('/admin/security')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-purple-500/10 hover:text-purple-400 transition-colors"
                >
                    <Shield size={20} />
                    <span className="font-medium">Security</span>
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}

