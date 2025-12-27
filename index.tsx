import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

type TransactionType = 'PURCHASE' | 'PAYMENT';

interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  lastUpdated: number;
}

interface KiranaState {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
}

// --- Constants ---
const INITIAL_STATE: KiranaState = {
  products: [
    { id: '1', name: 'Basmati Rice 1kg', price: 120, category: 'Grains' },
    { id: '2', name: 'Tata Salt 1kg', price: 28, category: 'Spices' },
    { id: '3', name: 'Fortune Soyabean Oil 1L', price: 165, category: 'Essentials' },
    { id: '4', name: 'Aashirvaad Atta 5kg', price: 245, category: 'Grains' },
    { id: '5', name: 'Amul Butter 100g', price: 58, category: 'Dairy' },
  ],
  customers: [
    { id: 'c1', name: 'Rahul Sharma', phone: '9876543210', outstandingBalance: 1250, lastUpdated: Date.now() },
    { id: 'c2', name: 'Priya Verma', phone: '9123456780', outstandingBalance: 0, lastUpdated: Date.now() },
    { id: 'c3', name: 'Amit Gupta', phone: '9988776655', outstandingBalance: 450, lastUpdated: Date.now() },
  ],
  transactions: []
};

// --- AI Service ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const extractItemsFromImage = async (base64Image: string): Promise<{ name: string; price: number }[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Extract products and their prices from this grocery list or bill. Return the data in a clean JSON format. If a price is not found, estimate a reasonable market price or return 0. Only return the JSON array.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the product" },
              price: { type: Type.NUMBER, description: "Price of the product" },
            },
            required: ["name", "price"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

// --- Components ---

const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`${bg} p-6 rounded-2xl border border-transparent hover:border-slate-200 transition-all cursor-default`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
  </div>
);

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
      active ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 translate-x-1' : 'hover:bg-slate-800 text-slate-400'
    }`}
  >
    <span className="text-xl">{icon}</span>
    <span className="font-bold text-sm tracking-wide">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-extrabold uppercase tracking-widest">{label}</span>
  </button>
);

// --- Main App Logic ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'customers'>('dashboard');
  const [viewMode, setViewMode] = useState<'shopkeeper' | 'customer'>('shopkeeper');
  const [state, setState] = useState<KiranaState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kirana_data_v3');
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('kirana_data_v3', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'outstandingBalance' | 'lastUpdated'>) => {
    const newCustomer: Customer = { 
      ...customer, 
      id: Math.random().toString(36).substr(2, 9),
      outstandingBalance: 0,
      lastUpdated: Date.now()
    };
    setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
  };

  const recordTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };

    setState(prev => {
      const updatedCustomers = prev.customers.map(c => {
        if (c.id === tx.customerId) {
          const adjustment = tx.type === 'PURCHASE' ? tx.amount : -tx.amount;
          return {
            ...c,
            outstandingBalance: Math.max(0, c.outstandingBalance + adjustment),
            lastUpdated: Date.now()
          };
        }
        return c;
      });

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        customers: updatedCustomers
      };
    });
  };

  if (!isLoaded) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <h1 className="text-xl font-black tracking-tighter">KIRANA KHATA</h1>
      <p className="text-slate-400 text-sm">Opening your shop...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-white p-6 sticky top-0 h-screen shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-500/20">K</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">KiranaKhata</h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Digital Ledger</p>
          </div>
        </div>
        
        <div className="mb-8 p-1 bg-slate-800 rounded-xl flex">
          <button 
            onClick={() => setViewMode('shopkeeper')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'shopkeeper' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
          >
            Shopkeeper
          </button>
          <button 
            onClick={() => { setViewMode('customer'); setActiveTab('customers'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'customer' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400'}`}
          >
            Customer
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {viewMode === 'shopkeeper' ? (
            <>
              <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Dashboard" />
              <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="📦" label="Inventory" />
              <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="👥" label="Customer Khata" />
            </>
          ) : (
            <>
              <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="📖" label="My Bills" />
            </>
          )}
        </nav>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0,0.05)]">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Home" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="📦" label="Items" />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="👥" label="Khata" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && <DashboardView state={state} />}
        {activeTab === 'inventory' && <InventoryView products={state.products} onAddProduct={addProduct} />}
        {activeTab === 'customers' && (
          <CustomersView 
            customers={state.customers} 
            transactions={state.transactions}
            onAddCustomer={addCustomer}
            onAddTransaction={recordTransaction}
            isShopkeeper={viewMode === 'shopkeeper'}
          />
        )}
      </main>
    </div>
  );
};

// --- View: Dashboard ---
const DashboardView: React.FC<{ state: KiranaState }> = ({ state }) => {
  const totalCredit = state.customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const recentTransactions = state.transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Store Overview</h2>
        <p className="text-slate-500">Welcome back, Shopkeeper</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Credit (Udhaar)" value={`₹${totalCredit.toLocaleString()}`} color="text-red-600" bg="bg-red-50" icon="💳" />
        <StatCard label="Active Customers" value={state.customers.length.toString()} color="text-blue-600" bg="bg-blue-50" icon="👥" />
        <StatCard label="Products in Shop" value={state.products.length.toString()} color="text-emerald-600" bg="bg-emerald-50" icon="📦" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50"><h3 className="font-bold text-slate-800">Recent Transactions</h3></div>
          <div className="divide-y divide-slate-50">
            {recentTransactions.map(tx => (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${tx.type === 'PURCHASE' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {tx.type === 'PURCHASE' ? 'OUT' : 'IN'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{state.customers.find(c => c.id === tx.customerId)?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-500'}`}>{tx.type === 'PURCHASE' ? '+' : '-'} ₹{tx.amount}</div>
              </div>
            ))}
            {recentTransactions.length === 0 && <div className="p-10 text-center text-slate-400 italic">No transactions yet</div>}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50"><h3 className="font-bold text-slate-800">Highest Credit Customers</h3></div>
          <div className="p-4 space-y-4">
            {state.customers.filter(c => c.outstandingBalance > 0).sort((a, b) => b.outstandingBalance - a.outstandingBalance).slice(0, 5).map(customer => (
                <div key={customer.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                   <div><p className="font-medium text-slate-900">{customer.name}</p><p className="text-xs text-slate-500">{customer.phone}</p></div>
                   <div className="text-right"><p className="font-bold text-red-600">₹{customer.outstandingBalance}</p></div>
                </div>
              ))}
              {state.customers.filter(c => c.outstandingBalance > 0).length === 0 && <p className="text-center p-6 text-slate-400">All balances cleared! 🥳</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- View: Inventory ---
const InventoryView: React.FC<{ products: Product[], onAddProduct: (p: any) => void }> = ({ products, onAddProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState({ name: '', price: '', category: 'General' });

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;
    onAddProduct({ name: newProd.name, price: parseFloat(newProd.price), category: newProd.category });
    setNewProd({ name: '', price: '', category: 'General' });
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-3xl font-bold text-slate-900">Inventory</h2><p className="text-slate-500">Manage items and prices</p></div>
        <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all">➕ Add Product</button>
      </header>

      <input type="text" placeholder="Search products..." className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
            <tr><th className="px-6 py-4">Product Name</th><th className="px-6 py-4">Category</th><th className="px-6 py-4 text-right">Price</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-semibold">{p.name}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded-full text-xs">{p.category}</span></td>
                <td className="px-6 py-4 text-right font-bold text-slate-900">₹{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6">
            <div className="flex justify-between mb-4"><h3 className="text-xl font-bold">Add Product</h3><button onClick={() => setShowAddModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required className="w-full border rounded-xl px-4 py-3" placeholder="Product Name" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
              <input required type="number" className="w-full border rounded-xl px-4 py-3" placeholder="Price (₹)" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl">Save Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Customers ---
const CustomersView: React.FC<{ customers: Customer[], transactions: Transaction[], onAddCustomer: (c: any) => void, onAddTransaction: (t: any) => void, isShopkeeper: boolean }> = ({ customers, transactions, onAddCustomer, onAddTransaction, isShopkeeper }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCust, setNewCust] = useState({ name: '', phone: '' });
  const [txData, setTxData] = useState<{ type: 'PURCHASE' | 'PAYMENT', amount: string, desc: string }>({ type: 'PURCHASE', amount: '', desc: '' });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const history = transactions.filter(t => t.customerId === selectedCustomerId);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const items = await extractItemsFromImage(base64);
        const total = items.reduce((acc, curr) => acc + curr.price, 0);
        setTxData({ type: 'PURCHASE', amount: total.toString(), desc: `Scanned: ${items.map(i => i.name).join(', ')}` });
        setIsScanning(false);
        setShowTransactionModal(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      alert('Scanning failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-4">
        <header className="flex justify-between items-center"><h2 className="text-2xl font-black">Khata</h2>{isShopkeeper && <button onClick={() => setShowAddCustomerModal(true)} className="p-2 bg-emerald-500 text-white rounded-lg">➕</button>}</header>
        {customers.map(c => (
          <button key={c.id} onClick={() => setSelectedCustomerId(c.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedCustomerId === c.id ? 'border-emerald-500 bg-white shadow-lg' : 'border-transparent bg-white'}`}>
            <div className="flex justify-between items-center">
              <div><p className="font-bold">{c.name}</p><p className="text-xs text-slate-400">{c.phone}</p></div>
              <div className="text-right"><p className={`font-black ${c.outstandingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>₹{c.outstandingBalance}</p></div>
            </div>
          </button>
        ))}
      </div>

      <div className="lg:col-span-8">
        {selectedCustomer ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <div><h3 className="text-2xl font-black">{selectedCustomer.name}</h3><p className="text-sm text-slate-400">{selectedCustomer.phone}</p></div>
                {isShopkeeper && (
                  <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 rounded-xl">📷</button>
                    <button onClick={() => { setTxData({ ...txData, type: 'PURCHASE' }); setShowTransactionModal(true); }} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold">Credit (+)</button>
                    <button onClick={() => { setTxData({ ...txData, type: 'PAYMENT' }); setShowTransactionModal(true); }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold">Paid (-)</button>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleScan} />
              <div className="bg-rose-50 p-6 rounded-2xl"><p className="text-xs font-black text-rose-400 uppercase">Udhaar Balance</p><p className="text-4xl font-black text-rose-600">₹{selectedCustomer.outstandingBalance}</p></div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border">
              <div className="p-4 bg-slate-50 border-b font-bold text-xs uppercase text-slate-400">Transaction History</div>
              <div className="divide-y">
                {history.map(tx => (
                  <div key={tx.id} className="p-4 flex justify-between items-center">
                    <div><p className="font-bold">{tx.description}</p><p className="text-[10px] text-slate-400">{new Date(tx.timestamp).toLocaleString()}</p></div>
                    <p className={`font-black ${tx.type === 'PURCHASE' ? 'text-rose-500' : 'text-emerald-500'}`}>{tx.type === 'PURCHASE' ? '+' : '-'} ₹{tx.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <div className="h-64 flex items-center justify-center text-slate-400 bg-white rounded-3xl border-2 border-dashed">Select a customer to view ledger</div>}
      </div>

      {showTransactionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">{txData.type === 'PURCHASE' ? 'Add Credit' : 'Payment Received'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddTransaction({ customerId: selectedCustomerId, ...txData, amount: parseFloat(txData.amount) }); setShowTransactionModal(false); }} className="space-y-4">
              <input required type="number" className="w-full border-2 p-4 rounded-xl text-3xl font-black" placeholder="Amount" value={txData.amount} onChange={e => setTxData({...txData, amount: e.target.value})} />
              <input className="w-full border-2 p-4 rounded-xl" placeholder="Description" value={txData.desc} onChange={e => setTxData({...txData, desc: e.target.value})} />
              <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8">
            <h3 className="text-xl font-bold mb-4">New Account</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAddCustomer(newCust); setShowAddCustomerModal(false); }} className="space-y-4">
              <input required className="w-full border-2 p-4 rounded-xl" placeholder="Full Name" value={newCust.name} onChange={e => setNewCust({...newCust, name: e.target.value})} />
              <input required className="w-full border-2 p-4 rounded-xl" placeholder="Phone Number" value={newCust.phone} onChange={e => setNewCust({...newCust, phone: e.target.value})} />
              <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Create Khata</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Render ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}