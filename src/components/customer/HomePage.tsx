import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Vegetable } from '../../types/database';
import { useSettings } from '../../hooks/useSettings';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { WhatsAppButton } from '../shared/WhatsAppButton';
import { VegetableCardSkeleton } from '../shared/Skeletons';
import { EmptyState } from '../shared/EmptyState';
import { ShoppingCart, Search, X, Minus, Plus, Leaf, User, LogOut, Sun, Moon } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import toast from 'react-hot-toast';

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function HomePage() {
  const { settings } = useSettings();
  const { items: cartItems, addItem, updateQuantity, totalItems, totalAmount } = useCart();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAvail, setFilterAvail] = useState<'all' | 'available'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadVegetables();
    const channel = supabase
      .channel('customer-vegetables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vegetables' }, loadVegetables)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadVegetables() {
    const { data, error } = await supabase
      .from('vegetables')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load vegetables:', error);
      toast.error('Failed to load vegetables');
    }
    setVegetables(data ?? []);
    setLoading(false);
  }

  const filtered = vegetables.filter((v) => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchAvail = filterAvail === 'all' || v.is_available;
    return matchSearch && matchAvail;
  });

  function getCartQty(id: string) {
    return cartItems.find((i) => i.vegetable.id === id)?.quantity ?? 0;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
              {settings?.store_name ?? 'Fresh Veggies'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setMenuOpen((m) => !m)}
                className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-2.5 py-1.5 rounded-xl text-sm font-medium transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {profile?.full_name || 'Account'}
                </span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 w-44">
                    <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {profile?.full_name || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{profile?.role}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/orders'); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      My Orders
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/account'); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Account Settings
                    </button>
                    <button
                      onClick={toggleTheme}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5" /> Light Mode
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5" /> Dark Mode
                        </>
                      )}
                    </button>
                    <button
                      onClick={async () => { await signOut(); setMenuOpen(false); navigate('/login'); }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 pb-24">
        {/* Banner */}
        {settings?.banner_url && (
          <div className="mt-4 rounded-2xl overflow-hidden h-36 sm:h-48">
            <img src={settings.banner_url} alt="Store banner" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Store info */}
        <div className="mt-4 mb-5">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{settings?.store_name ?? 'Fresh Veggies'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {settings?.opening_time && settings.closing_time
              ? `Open ${settings.opening_time} – ${settings.closing_time}`
              : 'Fresh vegetables delivered to your door'}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search vegetables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {(['all', 'available'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterAvail(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterAvail === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {f === 'all' ? 'All Items' : 'Available'}
            </button>
          ))}
        </div>

        {/* Today's label */}
        <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Today's Fresh Vegetables</h2>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <VegetableCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No vegetables found" description="Check back soon for fresh arrivals!" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((v) => {
              const qty = getCartQty(v.id);
              return (
                <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="relative">
                    <img
                      src={v.image_url || DEFAULT_IMAGE}
                      alt={v.name}
                      className={`w-full h-36 sm:h-40 object-cover ${!v.is_available ? 'grayscale opacity-70' : ''}`}
                    />
                    {!v.is_available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{v.name}</h3>
                    <p className="text-green-600 dark:text-green-400 font-bold text-sm mt-0.5">
                      {formatPrice(v.price)}
                      <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">/{v.unit}</span>
                    </p>
                    {v.quantity_available != null && v.is_available && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {v.quantity_available} {v.unit} left
                      </p>
                    )}

                    {v.is_available ? (
                      qty === 0 ? (
                        <button
                          onClick={() => { addItem(v); toast.success(`${v.name} added to cart`); }}
                          className="w-full mt-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-xs font-semibold py-2 rounded-xl transition-all"
                        >
                          Add to Cart
                        </button>
                      ) : (
                        <div className="flex items-center justify-between mt-2 bg-green-50 dark:bg-green-900/30 rounded-xl px-1 py-1">
                          <button
                            onClick={() => updateQuantity(v.id, qty - 1)}
                            className="w-8 h-8 bg-white dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-gray-600 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">{qty}</span>
                          <button
                            onClick={() => updateQuantity(v.id, qty + 1)}
                            className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white hover:bg-green-700 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    ) : (
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs font-semibold py-2 rounded-xl text-center">
                        Unavailable
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky cart button */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-xl mx-auto z-40">
          <button
            onClick={() => navigate('/cart')}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white rounded-2xl py-3.5 px-4 flex items-center justify-between shadow-xl transition-all"
          >
            <span className="bg-green-700 rounded-xl px-2 py-0.5 text-xs font-bold">{totalItems} items</span>
            <span className="font-semibold text-sm">View Cart</span>
            <span className="font-bold text-sm">{formatPrice(totalAmount)}</span>
          </button>
        </div>
      )}

      <WhatsAppButton number={settings?.whatsapp_number ?? ''} storeName={settings?.store_name} />
    </div>
  );
}
