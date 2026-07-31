import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { OrderWithItems } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatPrice, generateOrderShortId, getOrderStatusColor, getOrderStatusLabel } from '../../lib/utils';
import { OrderCardSkeleton } from '../shared/Skeletons';
import { EmptyState } from '../shared/EmptyState';
import { ArrowLeft, Ban, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    const channel = supabase
      .channel('my-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadOrders() {
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
    setLoading(false);
  }

  async function handleCancel(orderId: string) {
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    setCancellingId(orderId);
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    setCancellingId(null);
    if (error) {
      console.error('Failed to cancel order:', error);
      toast.error('Failed to cancel');
    } else toast.success('Order cancelled');
    loadOrders();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">My Orders</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4 pb-8 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10 text-green-400" />}
            title="No orders yet"
            description="Your past orders will appear here."
            action={
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Start Shopping
              </button>
            }
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
                        onClick={() => handleCancel(order.id)}
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
    </div>
  );
}
