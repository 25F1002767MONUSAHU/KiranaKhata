
import React, { useState, useRef } from 'react';
import { Customer, Transaction, Product } from '../types';
import { extractItemsFromImage } from '../services/geminiService';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  products: Product[];
  onAddCustomer: (c: any) => void;
  onAddTransaction: (t: any) => void;
  isShopkeeper: boolean;
}

export const Customers: React.FC<CustomersProps> = ({ customers, transactions, products, onAddCustomer, onAddTransaction, isShopkeeper }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCust, setNewCust] = useState({ name: '', phone: '' });
  const [txData, setTxData] = useState<{ type: 'PURCHASE' | 'PAYMENT', amount: string, desc: string }>({ 
    type: 'PURCHASE', amount: '', desc: '' 
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const customerHistory = transactions.filter(t => t.customerId === selectedCustomerId);

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !txData.amount) return;
    onAddTransaction({
      customerId: selectedCustomerId,
      type: txData.type,
      amount: parseFloat(txData.amount),
      description: txData.desc || (txData.type === 'PURCHASE' ? 'New Purchase' : 'Payment Received')
    });
    setTxData({ type: 'PURCHASE', amount: '', desc: '' });
    setShowTransactionModal(false);
  };

  const handleAddCustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.phone) return;
    onAddCustomer(newCust);
    setNewCust({ name: '', phone: '' });
    setShowAddCustomerModal(false);
  };

  const handleScanList = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const items = await extractItemsFromImage(base64);
        
        const total = items.reduce((acc, curr) => acc + curr.price, 0);
        const desc = items.map(i => `${i.name} (₹${i.price})`).join(', ');
        
        setTxData({
          type: 'PURCHASE',
          amount: total.toString(),
          desc: `AI Scanned: ${desc}`
        });
        setIsScanning(false);
        setShowTransactionModal(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      alert('Failed to scan list. Please try manual entry.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Customer List Column */}
      <div className="lg:col-span-4 space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isShopkeeper ? 'Khata Books' : 'Select Account'}
          </h2>
          {isShopkeeper && (
            <button 
              onClick={() => setShowAddCustomerModal(true)}
              className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <span className="text-lg">➕</span>
            </button>
          )}
        </header>

        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
          {customers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomerId(c.id)}
              className={`w-full text-left p-5 rounded-2xl transition-all border-2 group ${
                selectedCustomerId === c.id 
                  ? 'bg-white border-emerald-500 shadow-xl shadow-emerald-500/10 -translate-y-1' 
                  : 'bg-white border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedCustomerId === c.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-lg ${c.outstandingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    ₹{c.outstandingBalance}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tighter">Due Balance</p>
                </div>
              </div>
            </button>
          ))}
          {customers.length === 0 && (
            <div className="text-center p-10 bg-slate-100/50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">No customers yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Detail Column */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCustomer ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 mb-1">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <p className="text-sm font-bold text-slate-400">Account Active • {selectedCustomer.phone}</p>
                  </div>
                </div>

                {isShopkeeper && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isScanning}
                      className="px-5 py-3 bg-indigo-50 text-indigo-600 font-bold rounded-2xl hover:bg-indigo-100 transition-all flex items-center gap-2 active:scale-95"
                    >
                      {isScanning ? <span className="animate-spin">🔄</span> : '📷'} 
                      <span className="text-sm">Scan List</span>
                    </button>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleScanList} />
                    
                    <button 
                      onClick={() => { setTxData({ ...txData, type: 'PURCHASE' }); setShowTransactionModal(true); }}
                      className="px-5 py-3 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all text-sm active:scale-95"
                    >
                      Give Credit (+)
                    </button>
                    <button 
                      onClick={() => { setTxData({ ...txData, type: 'PAYMENT' }); setShowTransactionModal(true); }}
                      className="px-5 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      Got Paid (-)
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Outstanding Balance (Udhaar)</p>
                  <p className="text-4xl font-black text-rose-600">₹{selectedCustomer.outstandingBalance}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Opened</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {new Date(selectedCustomer.lastUpdated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Transaction History</h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Showing all records
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {customerHistory.map(tx => (
                  <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm ${
                        tx.type === 'PURCHASE' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {tx.type === 'PURCHASE' ? '🛒' : '💸'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight mb-0.5">{tx.description}</p>
                        <p className="text-[11px] font-bold text-slate-400 uppercase">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${tx.type === 'PURCHASE' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {tx.type === 'PURCHASE' ? '+' : '-'} ₹{tx.amount}
                      </p>
                      <span className="text-[9px] font-extrabold text-slate-300 uppercase">Settled</span>
                    </div>
                  </div>
                ))}
                {customerHistory.length === 0 && (
                  <div className="p-20 text-center text-slate-400">
                    <div className="text-4xl mb-4 grayscale opacity-20">📜</div>
                    <p className="font-bold">No transactions recorded for this customer yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-slate-300 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-10 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-5xl">📖</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Select a Khata Account</h3>
            <p className="text-sm max-w-xs font-medium">Click on a customer from the left list to view their full ledger and manage their Udhaar.</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-slate-900">
                {txData.type === 'PURCHASE' ? 'Record Sale' : 'Receive Payment'}
              </h3>
              <button onClick={() => setShowTransactionModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm">✕</button>
            </div>
            <form onSubmit={handleTxSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Entry Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">₹</span>
                  <input 
                    autoFocus
                    required
                    type="number"
                    className="w-full text-5xl font-black border-2 border-slate-100 rounded-3xl px-12 py-8 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-100" 
                    value={txData.amount}
                    onChange={e => setTxData({...txData, amount: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Add Description (Items/Notes)</label>
                <textarea 
                  className="w-full border-2 border-slate-100 rounded-3xl px-6 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300" 
                  rows={3}
                  value={txData.desc}
                  onChange={e => setTxData({...txData, desc: e.target.value})}
                  placeholder="e.g. Rice, Dal, Tea or Monthly payment"
                />
              </div>
              <button 
                type="submit"
                className={`w-full py-6 text-white text-lg font-black rounded-3xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${
                  txData.type === 'PURCHASE' 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                }`}
              >
                <span>{txData.type === 'PURCHASE' ? 'Update Khata (+)' : 'Reduce Balance (-)'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New Khata</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-all shadow-sm">✕</button>
            </div>
            <form onSubmit={handleAddCustSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold" 
                  value={newCust.name}
                  onChange={e => setNewCust({...newCust, name: e.target.value})}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
                <input 
                  required
                  type="tel"
                  className="w-full border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold" 
                  value={newCust.phone}
                  onChange={e => setNewCust({...newCust, phone: e.target.value})}
                  placeholder="+91 00000 00000"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-6 bg-slate-900 text-white text-lg font-black rounded-3xl hover:bg-black transition-all shadow-2xl active:scale-95"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
