export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

// Uses OpenStreetMap Nominatim (free, no API key); manual trigger only — its policy caps ~1 req/sec.
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Geocoding request failed');

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  const [{ lat, lon, display_name }] = results;
  return { lat: parseFloat(lat), lng: parseFloat(lon), displayName: display_name };
}
