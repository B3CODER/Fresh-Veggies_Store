import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/AuthContext';
import { haversineDistanceKm, formatPrice } from '../../lib/utils';
import { ArrowLeft, MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { settings } = useSettings();
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [distanceError, setDistanceError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported in your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });

        if (settings?.latitude && settings.longitude) {
          const dist = haversineDistanceKm(lat, lng, settings.latitude, settings.longitude);
          const radius = settings.delivery_radius_km ?? 5;
          if (dist > radius) {
            setDistanceError(
              `Sorry, we currently deliver only within ${radius} km. You are ${dist.toFixed(1)} km away.`,
            );
          } else {
            setDistanceError('');
            toast.success(`Location set! You are ${dist.toFixed(1)} km from the store.`);
          }
        } else {
          toast.success('Location captured!');
        }
        setLocating(false);
      },
      () => {
        toast.error('Could not get your location. Please enter address manually.');
        setLocating(false);
      },
    );
  }

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault();
    if (distanceError) { toast.error(distanceError); return; }

    if (settings?.latitude && settings.longitude && !location) {
      const confirmed = window.confirm(
        'You have not provided your location. The store may not be able to verify delivery distance. Continue?',
      );
      if (!confirmed) return;
    }

    setPlacing(true);

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          delivery_address: form.address.trim(),
          latitude: location?.lat ?? null,
          longitude: location?.lng ?? null,
          total_amount: totalAmount,
          status: 'pending',
          notes: '',
        })
        .select()
        .single();

      if (orderError || !orderData) {
        toast.error('Failed to place order. Please try again.');
        setPlacing(false);
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        vegetable_id: item.vegetable.id,
        vegetable_name: item.vegetable.name,
        vegetable_unit: item.vegetable.unit,
        price_at_order: item.vegetable.price,
        quantity: item.quantity,
        subtotal: item.vegetable.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        toast.error('Order placed but items failed to save. Contact the store.');
      }

      clearCart();
      navigate(`/order/${orderData.id}`, { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/cart')} className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900">Checkout</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4">
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          {/* Customer details */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900">Your Details</h2>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Full Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter your name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Mobile Number *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
            <h2 className="font-semibold text-gray-900">Delivery Address</h2>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Address *</label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="House no., Street, Area, City…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 border border-green-300 text-green-700 font-semibold py-2.5 rounded-xl text-sm hover:bg-green-50 disabled:opacity-60 transition-colors"
            >
              {locating ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
              {locating ? 'Getting location…' : location ? 'Location captured ✓' : 'Use My Current Location'}
            </button>
            {location && (
              <p className="text-xs text-gray-400 text-center">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
            )}
            {distanceError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
                {distanceError}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {items.map(({ vegetable, quantity }) => (
                <div key={vegetable.id} className="flex justify-between text-gray-600">
                  <span>{vegetable.name} × {quantity}</span>
                  <span>{formatPrice(vegetable.price * quantity)}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-up">
            <div className="max-w-xl mx-auto">
              <button
                type="submit"
                disabled={placing || !!distanceError}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 active:scale-[0.99] text-white rounded-2xl py-3.5 font-semibold text-base transition-all shadow-lg"
              >
                {placing ? 'Placing Order…' : `Place Order · ${formatPrice(totalAmount)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
