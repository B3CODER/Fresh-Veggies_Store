import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { OrderWithItems } from '../../types/database';
import { formatDate, formatPrice, generateOrderShortId, getOrderStatusColor, getOrderStatusLabel } from '../../lib/utils';
import { OrderCardSkeleton } from '../shared/Skeletons';
import { EmptyState } from '../shared/EmptyState';
import { MapPin, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  pending: [
    { label: 'Accept', next: 'accepted', color: 'bg-blue-500 hover:bg-blue-600 text-white' },
    { label: 'Reject', next: 'rejected', color: 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400' },
  ],
  accepted: [
    { label: 'Start Preparing', next: 'preparing', color: 'bg-orange-500 hover:bg-orange-600 text-white' },
    { label: 'Reject', next: 'rejected', color: 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400' },
  ],
  preparing: [
    { label: 'Mark Completed', next: 'completed', color: 'bg-green-500 hover:bg-green-600 text-white' },
  ],
  completed: [],
  rejected: [],
  cancelled: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
      return;
    }
    setOrders((data as OrderWithItems[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update status');
    } else toast.success(`Status updated to ${status}`);
    setUpdating(null);
    loadOrders();
  }

  const filters = ['all', 'pending', 'accepted', 'preparing', 'completed', 'rejected', 'cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Orders</h1>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No orders found" description="Orders will appear here once customers place them." />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const isExpanded = expanded === order.id;
            const actions = STATUS_ACTIONS[order.status] ?? [];
            return (
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <span className="font-mono text-xs text-gray-400 dark:text-gray-500">#{generateOrderShortId(order.id)}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-0.5 break-words">{order.customer_name}</h3>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <a href={`tel:${order.customer_phone}`} className="hover:text-green-600 dark:hover:text-green-400 break-all">{order.customer_phone}</a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2 min-w-0 break-words">{order.delivery_address}</span>
                    </div>
                    {order.latitude && order.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        <MapPin className="w-3 h-3" /> View on Google Maps
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap mt-3">
                    <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total_amount)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(order.created_at)}</span>
                  </div>

                  {actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {actions.map(({ label, next, color }) => (
                        <button
                          key={next}
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order.id, next)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 ${color}`}
                        >
                          {updating === order.id ? '…' : label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <span>View items ({order.order_items.length})</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between gap-2 text-sm">
                        <span className="text-gray-700 dark:text-gray-300 min-w-0 break-words">
                          {item.vegetable_name} × {item.quantity} {item.vegetable_unit}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">{formatPrice(item.subtotal)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold text-sm text-gray-900 dark:text-gray-100">
                      <span>Total</span>
                      <span>{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
