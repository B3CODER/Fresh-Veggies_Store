import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { OrderWithItems } from '../../types/database';
import { formatDate, formatPrice, generateOrderShortId, getOrderStatusColor, getOrderStatusLabel } from '../../lib/utils';
import { useSettings } from '../../hooks/useSettings';
import { useAuth } from '../../context/AuthContext';
import { WhatsAppButton } from '../shared/WhatsAppButton';
import { CheckCircle, Clock, XCircle, Truck, ChefHat, ArrowLeft, Leaf, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

const STEPS = [
  { status: 'pending', label: 'Order Received', icon: CheckCircle },
  { status: 'accepted', label: 'Accepted', icon: Clock },
  { status: 'preparing', label: 'Preparing', icon: ChefHat },
  { status: 'completed', label: 'Delivered', icon: Truck },
];

function StatusTimeline({ status }: { status: string }) {
  if (status === 'rejected') {
    return (
      <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl p-4">
        <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700 dark:text-red-400">Order Rejected</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">Please contact the store for more info.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="space-y-3">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.status} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-green-600 ring-4 ring-green-100 dark:ring-green-900/40'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}
                />
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
            <div className="pt-1.5">
              <p
                className={`text-sm font-semibold ${
                  isCurrent ? 'text-green-700 dark:text-green-400' : isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {step.label}
              </p>
              {isCurrent && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {status === 'pending' ? 'Waiting for store confirmation' : ''}
                  {status === 'accepted' ? 'Your order has been accepted!' : ''}
                  {status === 'preparing' ? 'Your order is being prepared' : ''}
                  {status === 'completed' ? 'Your order has been delivered!' : ''}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderStatusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) { setNotFound(true); setLoading(false); return; }
    loadOrder();

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder((prev) => prev ? { ...prev, ...(payload.new as OrderWithItems) } : null);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function loadOrder() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id!)
      .maybeSingle();
    if (error || !data) { setNotFound(true); } else { setOrder(data as OrderWithItems); }
    setLoading(false);
  }

  async function handleCancel() {
    if (!order) return;
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setCancelling(true);
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    setCancelling(false);
    if (error) toast.error('Failed to cancel order');
    else toast.success('Order cancelled');
    loadOrder();
  }

  const canCancel = order && user && order.user_id === user.id && (order.status === 'pending' || order.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading order…</p>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
        <XCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Order Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">We couldn't find this order.</p>
        <button onClick={() => navigate('/')} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-xl flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-white" />
          </div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{settings?.store_name ?? 'Fresh Veggies'}</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
        {/* Order ID + status */}
        <div className="bg-green-600 rounded-2xl p-5 text-white text-center">
          <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-200" />
          <h2 className="text-lg font-bold">Order Confirmed!</h2>
          <p className="text-green-200 text-sm mt-1">
            Order #{generateOrderShortId(order.id)}
          </p>
          <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Status</h2>
          <StatusTimeline status={order.status} />
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Your Items</h2>
          <div className="space-y-2">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {item.vegetable_name} × {item.quantity} {item.vegetable_unit}
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold">
              <span className="text-gray-900 dark:text-gray-100">Total</span>
              <span className="text-green-600 dark:text-green-400">{formatPrice(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Customer info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Delivery Details</h2>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Name:</span> {order.customer_name}</p>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Phone:</span> {order.customer_phone}</p>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Address:</span> {order.delivery_address}</p>
            <p><span className="font-medium text-gray-900 dark:text-gray-100">Placed:</span> {formatDate(order.created_at)}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3 font-semibold text-sm transition-colors"
        >
          Continue Shopping
        </button>

        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-2xl py-3 font-semibold text-sm transition-colors"
          >
            <Ban className="w-4 h-4" />
            {cancelling ? 'Cancelling…' : 'Cancel This Order'}
          </button>
        )}
      </div>

      <WhatsAppButton number={settings?.whatsapp_number ?? ''} storeName={settings?.store_name} />
    </div>
  );
}
