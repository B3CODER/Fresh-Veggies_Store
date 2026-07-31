import { useEffect, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { Settings } from '../../types/database';
import { SettingsSkeleton } from '../shared/Skeletons';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    store_name: '',
    store_address: '',
    phone_number: '',
    whatsapp_number: '',
    delivery_radius_km: '5',
    enforce_delivery_radius: true,
    latitude: '',
    longitude: '',
    opening_time: '08:00',
    closing_time: '20:00',
    banner_url: '',
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('settings').select('*').maybeSingle();
      if (data) {
        setSettings(data);
        setForm({
          store_name: data.store_name,
          store_address: data.store_address,
          phone_number: data.phone_number,
          whatsapp_number: data.whatsapp_number,
          delivery_radius_km: String(data.delivery_radius_km),
          enforce_delivery_radius: data.enforce_delivery_radius ?? true,
          latitude: data.latitude != null ? String(data.latitude) : '',
          longitude: data.longitude != null ? String(data.longitude) : '',
          opening_time: data.opening_time,
          closing_time: data.closing_time,
          banner_url: data.banner_url,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      store_name: form.store_name,
      store_address: form.store_address,
      phone_number: form.phone_number,
      whatsapp_number: form.whatsapp_number,
      delivery_radius_km: parseFloat(form.delivery_radius_km) || 5,
      enforce_delivery_radius: form.enforce_delivery_radius,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      opening_time: form.opening_time,
      closing_time: form.closing_time,
      banner_url: form.banner_url,
    };

    if (settings) {
      const { error } = await supabase.from('settings').update(payload).eq('id', settings.id);
      if (error) toast.error('Failed to save settings');
      else toast.success('Settings saved!');
    } else {
      const { error } = await supabase.from('settings').insert(payload);
      if (error) toast.error('Failed to save settings');
      else toast.success('Settings saved!');
    }

    setSaving(false);
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        toast.success('Location captured!');
      },
      () => toast.error('Could not get location'),
    );
  }

  const fields = [
    { label: 'Store Name', key: 'store_name', type: 'text', placeholder: 'Fresh Veggies Store' },
    { label: 'Store Address', key: 'store_address', type: 'text', placeholder: '123 Market Street' },
    { label: 'Phone Number', key: 'phone_number', type: 'tel', placeholder: '+91 98765 43210' },
    { label: 'WhatsApp Number', key: 'whatsapp_number', type: 'tel', placeholder: '+919876543210' },
    { label: 'Opening Time', key: 'opening_time', type: 'time', placeholder: '' },
    { label: 'Closing Time', key: 'closing_time', type: 'time', placeholder: '' },
    { label: 'Store Banner Image URL', key: 'banner_url', type: 'url', placeholder: 'https://...' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {loading ? (
        <SettingsSkeleton />
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Store Information</h2>
            {fields.map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-900">Delivery Area Restriction</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {form.enforce_delivery_radius
                    ? `Only customers within ${form.delivery_radius_km || 5} km of the store can place an order.`
                    : 'Off — orders are accepted from any location, distance is not checked.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.enforce_delivery_radius}
                onClick={() => setForm((f) => ({ ...f, enforce_delivery_radius: !f.enforce_delivery_radius }))}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                  form.enforce_delivery_radius ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.enforce_delivery_radius ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className={form.enforce_delivery_radius ? '' : 'opacity-50 pointer-events-none'}>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Delivery Radius (km)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.delivery_radius_km}
                onChange={(e) => setForm((f) => ({ ...f, delivery_radius_km: e.target.value }))}
                placeholder="5"
                disabled={!form.enforce_delivery_radius}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50"
              />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Store Location</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pin the store's exact coordinates — required for distance to be calculated.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                    placeholder="e.g. 13.0827"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                    placeholder="e.g. 80.2707"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                className="w-full border border-green-300 text-green-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors"
              >
                Use My Current Location
              </button>
              {form.enforce_delivery_radius && (!form.latitude || !form.longitude) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
                  Restriction is ON but store coordinates are not set — until you set them, distance can't be
                  verified and all orders will be accepted.
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
