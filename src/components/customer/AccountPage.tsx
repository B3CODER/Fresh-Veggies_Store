import { useEffect, useState, lazy, Suspense, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { CustomerAddress } from '../../types/database';
import { ArrowLeft, MapPin, Trash2, Plus, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationPickerMap = lazy(() => import('../shared/LocationPickerMap'));

export default function AccountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [label, setLabel] = useState('Home');
  const [addressText, setAddressText] = useState('');
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to load saved addresses:', error);
      toast.error('Failed to load saved addresses');
    }
    setAddresses((data as CustomerAddress[]) ?? []);
    setLoading(false);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success('Password updated!');
      setNewPassword('');
    }
    setChangingPassword(false);
  }

  function resetAddForm() {
    setShowAddForm(false);
    setLabel('Home');
    setAddressText('');
    setPinned(null);
  }

  async function handleSaveAddress() {
    if (!addressText.trim()) {
      toast.error('Please enter an address');
      return;
    }
    if (!pinned) {
      toast.error('Please pin your exact location on the map first');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('customer_addresses').insert({
      user_id: user!.id,
      label: label.trim() || 'Home',
      address_text: addressText.trim(),
      latitude: pinned.lat,
      longitude: pinned.lng,
    });
    if (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address');
    } else {
      toast.success('Address saved!');
      resetAddForm();
      loadAddresses();
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved address?')) return;
    const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete');
    } else {
      toast.success('Address deleted');
      loadAddresses();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-10">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">Account Settings</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-4">
        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min. 6 characters)"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {changingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Saved Addresses
            </h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1 text-green-700 dark:text-green-400 text-sm font-semibold hover:text-green-800 dark:hover:text-green-300"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
          ) : addresses.length === 0 && !showAddForm ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              No saved addresses yet. Add one to skip location checks at checkout.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <div key={addr.id} className="flex items-start justify-between gap-2 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{addr.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{addr.address_text}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option>Home</option>
                  <option>Home 2</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Address</label>
                <textarea
                  rows={2}
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="House no., Street, Area, City…"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(true)}
                className={`w-full flex items-center justify-center gap-2 border font-semibold py-2.5 rounded-xl text-sm transition-colors ${
                  pinned
                    ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <MapPin className="w-4 h-4" />
                {pinned ? 'Location pinned ✓ (tap to adjust)' : 'Pin Location on Map *'}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetAddForm}
                  className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAddress}
                  disabled={saving || !pinned}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showMapPicker && (
        <Suspense fallback={null}>
          <LocationPickerMap
            initialLat={pinned?.lat}
            initialLng={pinned?.lng}
            onConfirm={(lat, lng) => {
              setPinned({ lat, lng });
              setShowMapPicker(false);
            }}
            onCancel={() => setShowMapPicker(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
