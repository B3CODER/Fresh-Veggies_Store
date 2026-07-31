import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Carrot, ClipboardList, TrendingUp, Clock } from 'lucide-react';
import { formatDate, formatPrice } from '../../lib/utils';
import type { Order } from '../../types/database';

export default function DashboardPage() {
  const [stats, setStats] = useState({ vegetables: 0, pending: 0, today: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [vegRes, orderRes] = await Promise.all([
        supabase.from('vegetables').select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const orders: Order[] = orderRes.data ?? [];
      const today = new Date().toDateString();
      const todayOrders = orders.filter(
        (o) => new Date(o.created_at).toDateString() === today,
      );

      setStats({
        vegetables: vegRes.count ?? 0,
        pending: orders.filter((o) => o.status === 'pending').length,
        today: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + o.total_amount, 0),
      });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Vegetables', value: stats.vegetables, icon: Carrot, color: 'bg-emerald-500' },
    { label: 'Pending Orders', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
    { label: "Today's Orders", value: stats.today, icon: ClipboardList, color: 'bg-blue-500' },
    { label: "Today's Revenue", value: formatPrice(stats.revenue), icon: TrendingUp, color: 'bg-purple-500' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-700 bg-yellow-100',
    accepted: 'text-blue-700 bg-blue-100',
    preparing: 'text-orange-700 bg-orange-100',
    completed: 'text-green-700 bg-green-100',
    rejected: 'text-red-700 bg-red-100',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-green-600 font-medium hover:underline">
            View all
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {formatPrice(order.total_amount)}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] ?? 'text-gray-700 bg-gray-100'}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
