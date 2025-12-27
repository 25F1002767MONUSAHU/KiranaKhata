
import React, { useState, useRef } from 'react';
import { Customer, Transaction, Product } from '../types';
import { extractItemsFromImage } from '../services/geminiService';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  products: Product[];
  onAddCustomer: (c: any) => void;
  onAddTransaction: (t: any) => void;
}

export const Customers: React.FC<CustomersProps> = ({ customers, transactions, products, onAddCustomer, onAddTransaction }) => {
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
          desc: `Scanned Items: ${desc}`
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Customer List Column */}
      <div className="lg:col-span-1 space-y-6">
        <header className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Khata Book</h2>
          <button 
            onClick={() => setShowAddCustomerModal(true)}
            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
          >
            ➕ New Customer
          </button>
        </header>

        <div className="space-y-3">
          {customers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomerId(c.id)}
              className={`w-full text-left p-4 rounded-2xl transition-all border ${
                selectedCustomerId === c.id 
                  ? 'bg-emerald-50 border-emerald-500 shadow-md shadow-emerald-500/10' 
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-slate-800">{c.name}</p>
                <span className={`font-bold ${c.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  ₹{c.outstandingBalance}
                </span>
              </div>
              <p className="text-xs text-slate-400">{c.phone}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Detail Column */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCustomer ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedCustomer.name}</h3>
                  <p className="text-slate-500">{selectedCustomer.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                    className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 font-bold rounded-xl hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {isScanning ? 'Scanning...' : '📷 Scan List'}
                  </button>
                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleScanList} />
                  
                  <button 
                    onClick={() => { setTxData({ ...txData, type: 'PURCHASE' }); setShowTransactionModal(true); }}
                    className="flex-1 md:flex-none px-4 py-2 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition-colors"
                  >
                    Udhaar (+)
                  </button>
                  <button 
                    onClick={() => { setTxData({ ...txData, type: 'PAYMENT' }); setShowTransactionModal(true); }}
                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl hover:bg-emerald-200 transition-colors"
                  >
                    Paid (-)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">₹{selectedCustomer.outstandingBalance}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Last Activity</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(selectedCustomer.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b">
                <h4 className="font-bold text-slate-800">Ledger History</h4>
              </div>
              <div className="divide-y divide-slate-50">
                {customerHistory.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                    <div className={`font-bold ${tx.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {tx.type === 'PURCHASE' ? '+' : '-'} ₹{tx.amount}
                    </div>
                  </div>
                ))}
                {customerHistory.length === 0 && (
                  <div className="p-12 text-center text-slate-400 italic">No transactions recorded yet</div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <span className="text-5xl mb-4">📖</span>
            <p className="text-lg font-medium">Select a customer to view their khata</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">{txData.type === 'PURCHASE' ? 'Record Sale (Udhaar)' : 'Receive Payment'}</h3>
              <button onClick={() => setShowTransactionModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input 
                  autoFocus
                  required
                  type="number"
                  className="w-full text-3xl font-bold border rounded-2xl px-4 py-4 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={txData.amount}
                  onChange={e => setTxData({...txData, amount: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Items / Remarks</label>
                <textarea 
                  className="w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                  rows={3}
                  value={txData.desc}
                  onChange={e => setTxData({...txData, desc: e.target.value})}
                  placeholder="e.g. Rice, Dal, Tea or Payment for last month"
                />
              </div>
              <button 
                type="submit"
                className={`w-full py-4 text-white font-bold rounded-2xl transition-colors shadow-lg ${
                  txData.type === 'PURCHASE' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                Confirm Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">New Customer</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>
            <form onSubmit={handleAddCustSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Customer Name</label>
                <input 
                  autoFocus
                  required
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={newCust.name}
                  onChange={e => setNewCust({...newCust, name: e.target.value})}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mobile Number</label>
                <input 
                  required
                  type="tel"
                  className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={newCust.phone}
                  onChange={e => setNewCust({...newCust, phone: e.target.value})}
                  placeholder="98xxxxxx00"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
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
