import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { EmptyState } from '../shared/EmptyState';
import { formatPrice } from '../../lib/utils';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBasket } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalItems, totalAmount } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">My Cart</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<ShoppingBasket className="w-10 h-10 text-green-400" />}
            title="Your cart is empty"
            description="Add some fresh vegetables to get started."
            action={
              <button
                onClick={() => navigate('/')}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                Browse Vegetables
              </button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 dark:text-gray-100">My Cart</h1>
        <span className="text-sm text-gray-400 dark:text-gray-500">({totalItems} items)</span>
      </header>

      <div className="max-w-xl mx-auto px-4 pt-4 space-y-3">
        {items.map(({ vegetable, quantity }) => (
          <div key={vegetable.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-700">
            <img
              src={vegetable.image_url || 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=100'}
              alt={vegetable.name}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{vegetable.name}</h3>
              <p className="text-green-600 dark:text-green-400 font-bold text-sm mt-0.5">
                {formatPrice(vegetable.price)}/{vegetable.unit}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Subtotal: {formatPrice(vegetable.price * quantity)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 rounded-xl p-1">
                <button
                  onClick={() => updateQuantity(vegetable.id, quantity - 1)}
                  className="w-7 h-7 bg-white dark:bg-gray-700 rounded-lg shadow-sm flex items-center justify-center text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-gray-600"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-bold text-green-700 dark:text-green-400 w-6 text-center">{quantity}</span>
                <button
                  onClick={() => updateQuantity(vegetable.id, quantity + 1)}
                  className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white hover:bg-green-700"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={() => removeItem(vegetable.id)}
                className="w-7 h-7 text-gray-300 dark:text-gray-600 hover:text-red-500 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Order summary */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Order Summary</h2>
          <div className="space-y-2 text-sm">
            {items.map(({ vegetable, quantity }) => (
              <div key={vegetable.id} className="flex justify-between gap-2 text-gray-600 dark:text-gray-300">
                <span className="min-w-0 break-words">{vegetable.name} × {quantity}</span>
                <span className="flex-shrink-0">{formatPrice(vegetable.price * quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-gray-100">
              <span>Total</span>
              <span className="text-green-600 dark:text-green-400">{formatPrice(totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-up">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white rounded-2xl py-3.5 font-semibold text-base transition-all shadow-lg"
          >
            Proceed to Checkout · {formatPrice(totalAmount)}
          </button>
        </div>
      </div>
    </div>
  );
}
