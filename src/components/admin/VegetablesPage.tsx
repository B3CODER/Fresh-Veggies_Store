import { useEffect, useState, FormEvent, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Vegetable } from '../../types/database';
import { Plus, Pencil, Trash2, X, Upload, Search } from 'lucide-react';
import { formatPrice } from '../../lib/utils';
import { VegetableCardSkeleton } from '../shared/Skeletons';
import { EmptyState } from '../shared/EmptyState';
import toast from 'react-hot-toast';

const UNITS = ['kg', 'gram', 'piece', 'dozen'];

const DEFAULT_IMAGES: Record<string, string> = {
  tomato: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=400',
  potato: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400',
  onion: 'https://images.pexels.com/photos/175236/pexels-photo-175236.jpeg?auto=compress&cs=tinysrgb&w=400',
  carrot: 'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400',
  spinach: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=400',
  default: 'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg?auto=compress&cs=tinysrgb&w=400',
};

function getDefaultImage(name: string) {
  const lower = name.toLowerCase();
  for (const key of Object.keys(DEFAULT_IMAGES)) {
    if (lower.includes(key)) return DEFAULT_IMAGES[key];
  }
  return DEFAULT_IMAGES.default;
}

interface FormState {
  name: string;
  price: string;
  unit: string;
  quantity_available: string;
  is_available: boolean;
  image_url: string;
}

const emptyForm: FormState = {
  name: '',
  price: '',
  unit: 'kg',
  quantity_available: '',
  is_available: true,
  image_url: '',
};

export default function VegetablesPage() {
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vegetable | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVegetables();
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

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(v: Vegetable) {
    setEditing(v);
    setForm({
      name: v.name,
      price: String(v.price),
      unit: v.unit,
      quantity_available: v.quantity_available != null ? String(v.quantity_available) : '',
      is_available: v.is_available,
      image_url: v.image_url,
    });
    setShowModal(true);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      unit: form.unit,
      quantity_available: form.quantity_available ? parseFloat(form.quantity_available) : null,
      is_available: form.is_available,
      image_url: form.image_url || getDefaultImage(form.name),
    };

    if (editing) {
      const { error } = await supabase.from('vegetables').update(payload).eq('id', editing.id);
      if (error) { console.error('Failed to update vegetable:', error); toast.error('Failed to update'); } else { toast.success('Updated!'); }
    } else {
      const { error } = await supabase.from('vegetables').insert(payload);
      if (error) { console.error('Failed to add vegetable:', error); toast.error('Failed to add'); } else { toast.success('Added!'); }
    }

    setSaving(false);
    setShowModal(false);
    loadVegetables();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vegetable?')) return;
    setDeletingId(id);
    const { error } = await supabase.from('vegetables').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete vegetable:', error);
      toast.error('Failed to delete');
    } else toast.success('Deleted');
    setDeletingId(null);
    loadVegetables();
  }

  async function toggleAvailability(v: Vegetable) {
    const { error } = await supabase
      .from('vegetables')
      .update({ is_available: !v.is_available })
      .eq('id', v.id);
    if (error) {
      console.error('Failed to toggle availability:', error);
      toast.error('Failed to update');
    } else loadVegetables();
  }

  const filtered = vegetables.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Vegetables</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search vegetables…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <VegetableCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No vegetables found" description="Add your first item to get started." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((v) => (
            <div key={v.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="relative">
                <img
                  src={v.image_url || getDefaultImage(v.name)}
                  alt={v.name}
                  className="w-full h-36 object-cover"
                />
                {!v.is_available && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{v.name}</h3>
                <p className="text-green-600 dark:text-green-400 font-bold text-sm mt-0.5">
                  {formatPrice(v.price)}/{v.unit}
                </p>
                {v.quantity_available != null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stock: {v.quantity_available} {v.unit}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => toggleAvailability(v)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                      v.is_available
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                    }`}
                  >
                    {v.is_available ? 'Available' : 'Unavailable'}
                  </button>
                  <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={deletingId === v.id}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-3xl">
              <h2 className="font-bold text-gray-900 dark:text-gray-100">{editing ? 'Edit Vegetable' : 'Add Vegetable'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              {/* Image preview */}
              <div
                className="relative h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-700 cursor-pointer group"
                onClick={() => fileRef.current?.click()}
              >
                <img
                  src={form.image_url || getDefaultImage(form.name || 'default')}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                  <span className="text-white text-sm ml-2 font-medium">Change Image</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => setForm((f) => ({ ...f, image_url: ev.target?.result as string }));
                  reader.readAsDataURL(file);
                }}
              />
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Or paste image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tomato"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Price (₹) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Unit *</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Available Quantity (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.quantity_available}
                  onChange={(e) => setForm((f) => ({ ...f, quantity_available: e.target.value }))}
                  placeholder="Leave blank if unlimited"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, is_available: !f.is_available }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_available ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_available ? 'translate-x-5' : ''}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Available</span>
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : editing ? 'Update Vegetable' : 'Add Vegetable'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
