'use client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers in Next.js/Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
    id: number;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
}

export default function LocationsMap({ locations }: { locations: Location[] }) {
    // Only plot locations with valid GPS coordinates
    const validLocations = locations.filter(loc => loc.latitude != null && loc.longitude != null);

    if (locations.length === 0) return <div className="p-4 text-center">No locations captured yet.</div>;

    // If we have hits but no GPS, show a message instead of a broken map
    if (validLocations.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-gray-900 border border-white/10 rounded-lg">
                <div className="text-center p-6">
                    <p className="text-xl font-bold text-gray-400">Network Intelligence Only</p>
                    <p className="text-sm text-gray-500 mt-2">IP and User Agent logs captured, but GPS location was denied or not yet received.</p>
                </div>
            </div>
        );
    }

    // Use the first valid location as the center
    const center = [validLocations[0].latitude!, validLocations[0].longitude!] as [number, number];

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden relative z-0">
            <MapContainer center={center} zoom={2} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                {validLocations.map((loc) => (
                    <Marker key={loc.id} position={[loc.latitude!, loc.longitude!]}>
                        <Popup>
                            <div className="text-gray-900 text-sm">
                                <div className="font-bold mb-1">IP: {loc.ipAddress || 'Unknown'}</div>
                                <div>Acc: {Math.round(loc.accuracy || 0)}m</div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(loc.timestamp).toLocaleString()}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
