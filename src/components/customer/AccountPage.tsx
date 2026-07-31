import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { CustomerAddress, OrderWithItems } from '../../types/database';
import {
  formatDate,
  formatPrice,
  generateOrderShortId,
  getOrderStatusColor,
  getOrderStatusLabel,
} from '../../lib/utils';
import { OrderCardSkeleton } from '../shared/Skeletons';
import { EmptyState } from '../shared/EmptyState';
import { ArrowLeft, MapPin, Trash2, Plus, Lock, User, Package, Ban, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'addresses' | 'orders';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'addresses', label: 'Addresses' },
  { key: 'orders', label: 'Orders' },
];

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [label, setLabel] = useState('Home');
  const [addressText, setAddressText] = useState('');
  const [pinned, setPinned] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Orders
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  useEffect(() => {
    loadAddresses();
  }, []);

  useEffect(() => {
    if (tab === 'orders' && !ordersLoaded) loadOrders();
  }, [tab, ordersLoaded]);

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
    setLoadingAddresses(false);
  }

  async function loadOrders() {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    }
    setOrders((data as OrderWithItems[]) ?? []);
    setLoadingOrders(false);
    setOrdersLoaded(true);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq('id', user!.id);
    if (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
      await refreshProfile();
    }
    setSavingProfile(false);
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

  function useCurrentLocationForAddress() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPinned({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location captured!');
        setLocating(false);
      },
      () => {
        toast.error('Could not get your location');
        setLocating(false);
      },
    );
  }

  async function handleSaveAddress() {
    if (!addressText.trim()) {
      toast.error('Please enter an address');
      return;
    }
    if (!pinned) {
      toast.error('Please capture your current location first');
      return;
    }
    setSavingAddress(true);
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
    setSavingAddress(false);
  }

  async function handleDeleteAddress(id: string) {
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

  async function handleCancelOrder(orderId: string) {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(orderId);
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    setCancellingId(null);
    if (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel');
    } else {
      toast.success('Order cancelled');
      loadOrders();
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

      <div className="max-w-xl mx-auto px-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {TABS.map(({ key, label: tabLabel }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === key
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tabLabel}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <User className="w-4 h-4" /> Profile Information
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Email</label>
                  <input
                    disabled
                    value={user?.email ?? ''}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Full Name *</label>
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Mobile Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {savingProfile ? 'Saving…' : 'Save Profile'}
                </button>
              </form>
            </div>

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
          </div>
        )}

        {/* Addresses tab */}
        {tab === 'addresses' && (
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

            {loadingAddresses ? (
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
                      onClick={() => handleDeleteAddress(addr.id)}
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
                  onClick={useCurrentLocationForAddress}
                  disabled={locating}
                  className={`w-full flex items-center justify-center gap-2 border font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60 ${
                    pinned
                      ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {locating ? <Loader className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {locating ? 'Getting location…' : pinned ? 'Location captured ✓' : 'Use Current Location *'}
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
                    disabled={savingAddress || !pinned}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    {savingAddress ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {loadingOrders ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <OrderCardSkeleton key={i} />)}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                icon={<Package className="w-10 h-10 text-green-400" />}
                title="No orders yet"
                description="Your past orders will appear here."
              />
            ) : (
              orders.map((order) => {
                const canCancel = order.status === 'pending' || order.status === 'rejected';
                return (
                  <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">#{generateOrderShortId(order.id)}</span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                        {getOrderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {item.vegetable_name} × {item.quantity} {item.vegetable_unit}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">{formatPrice(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total_amount)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/order/${order.id}`)}
                          className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Ban className="w-3 h-3" />
                            {cancellingId === order.id ? '…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
