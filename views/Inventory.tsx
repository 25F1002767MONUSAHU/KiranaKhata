
import React, { useState } from 'react';
import { Product } from '../types';

interface InventoryProps {
  products: Product[];
  onAddProduct: (p: any) => void;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: '', category: 'General' });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;
    onAddProduct({
      name: newProd.name,
      price: parseFloat(newProd.price),
      category: newProd.category
    });
    setNewProd({ name: '', price: '', category: 'General' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Inventory</h2>
          <p className="text-slate-500">Manage your items and prices</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>➕</span> Add New Product
        </button>
      </header>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Search products or categories..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl grayscale opacity-50">🔍</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-800">{p.name}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-bold text-slate-900">₹{p.price}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                  No products found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Product Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={newProd.name}
                  onChange={e => setNewProd({...newProd, name: e.target.value})}
                  placeholder="e.g. Fortune Oil 1L"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input 
                    required
                    type="number"
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={newProd.category}
                    onChange={e => setNewProd({...newProd, category: e.target.value})}
                  >
                    <option>General</option>
                    <option>Grains</option>
                    <option>Spices</option>
                    <option>Snacks</option>
                    <option>Essentials</option>
                    <option>Personal Care</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
