import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader, X } from 'lucide-react';
import { geocodeAddress } from '../../lib/geocode';
import toast from 'react-hot-toast';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;transform:translate(-50%,-100%);filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="#16a34a" stroke="white" stroke-width="1">
      <path d="M12 2C7.6 2 4 5.6 4 10c0 5.4 6.7 11.1 7.3 11.6a1 1 0 0 0 1.4 0C13.3 21.1 20 15.4 20 10c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export default function LocationPickerMap({
  initialLat,
  initialLng,
  onConfirm,
  onCancel,
}: LocationPickerMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [position, setPosition] = useState({
    lat: initialLat ?? 20.5937,
    lng: initialLng ?? 78.9629,
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([position.lat, position.lng], initialLat != null ? 15 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([position.lat, position.lng], { draggable: true, icon: PIN_ICON }).addTo(map);
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      setPosition({ lat, lng });
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapInstance.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch() {
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const result = await geocodeAddress(searchText);
      if (!result) {
        toast.error('Could not find that area. Try a broader search, or drag the pin manually.');
        return;
      }
      setPosition({ lat: result.lat, lng: result.lng });
      mapInstance.current?.setView([result.lat, result.lng], 15);
      markerRef.current?.setLatLng([result.lat, result.lng]);
    } catch {
      toast.error('Search failed. Try again or drag the pin manually.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div
        className="bg-white dark:bg-gray-800 w-full sm:max-w-lg sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ height: '85vh', maxHeight: '600px' }}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">Pin your exact location</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search area, e.g. Nana Varachha, Surat"
              className="w-full pl-9 pr-16 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              {searching ? <Loader className="w-3.5 h-3.5 animate-spin" /> : 'Go'}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
            Search gets you close, then drag the green pin (or tap the map) to your exact spot.
          </p>
        </div>

        <div ref={mapRef} className="flex-1" />

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => onConfirm(position.lat, position.lng)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Confirm This Location
          </button>
        </div>
      </div>
    </div>
  );
}
