import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Plus, 
  Camera, 
  Search, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft,
  Store,
  X,
  Phone,
  Clock,
  History,
  TrendingUp,
  UserPlus
} from 'lucide-react';

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

// --- Constants & Initial Data ---
const STORAGE_KEY = 'kirana_pro_ledger_v3';

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

// --- AI Logic ---
const extractItemsFromImage = async (base64Image: string): Promise<{ name: string; price: number }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Extract products and their individual prices from this grocery list or receipt. Return ONLY a valid JSON array of objects with keys 'name' and 'price'. If no price is found, use a reasonable estimate for the Indian market or 0." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
            },
            required: ["name", "price"],
          },
        },
      },
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("AI Scan Error:", error);
    return [];
  }
};

// --- UI Sub-Components ---

const StatCard = ({ label, value, color, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-lg hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${color.replace('text', 'bg')}/10`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      {trend && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trend}</span>}
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <h4 className={`text-3xl font-black ${color}`}>{value}</h4>
  </div>
);

const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50'}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} /> {label}
  </button>
);

const MobileNavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
    <Icon className="w-5 h-5" />
    <span className="text-[9px] font-black uppercase mt-1 tracking-widest">{label}</span>
  </button>
);

// --- Main Application ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'customers'>('dashboard');
  const [state, setState] = useState<KiranaState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setState(JSON.parse(saved)); } catch (e) { console.error("Restore failed", e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const addProduct = (p: Omit<Product, 'id'>) => {
    const newP = { ...p, id: Math.random().toString(36).substr(2, 9) };
    setState(s => ({ ...s, products: [newP, ...s.products] }));
  };

  const addCustomer = (c: Omit<Customer, 'id' | 'outstandingBalance' | 'lastUpdated'>) => {
    const newC = { ...c, id: Math.random().toString(36).substr(2, 9), outstandingBalance: 0, lastUpdated: Date.now() };
    setState(s => ({ ...s, customers: [newC, ...s.customers] }));
  };

  const recordTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx = { ...tx, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() };
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
      return { ...prev, transactions: [newTx, ...prev.transactions], customers: updatedCustomers };
    });
  };

  if (!isLoaded) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-black">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h1 className="text-2xl tracking-tighter">KIRANAKHATA PRO</h1>
      <p className="text-slate-500 text-sm font-medium mt-2">Loading your digital ledger...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen fixed left-0 top-0 p-8 z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Store className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none">KiranaKhata</h1>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Premium Ledger</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Package} label="Inventory" />
          <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={Users} label="Khata Books" />
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Store</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs">🏪</div>
            <p className="font-bold text-sm text-slate-800 truncate">Apna Store</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-6 md:p-12 max-w-7xl mx-auto w-full pb-24 md:pb-12">
        {activeTab === 'dashboard' && <DashboardView state={state} />}
        {activeTab === 'inventory' && <InventoryView products={state.products} onAdd={addProduct} />}
        {activeTab === 'customers' && (
          <CustomersView 
            customers={state.customers} 
            transactions={state.transactions} 
            onAddCustomer={addCustomer} 
            onAddTx={recordTransaction} 
          />
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t flex justify-around items-center h-16 px-4 z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Home" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Package} label="Items" />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={Users} label="Khata" />
      </nav>
    </div>
  );
};

// --- Views ---

const DashboardView = ({ state }: { state: KiranaState }) => {
  const totalUdhaar = state.customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const recentTx = state.transactions.slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Store Health</h2>
          <p className="text-slate-500 font-medium">Monitoring your credit & stock</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Session</p>
          <p className="font-bold text-slate-800">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Outstanding" value={`₹${totalUdhaar}`} color="text-rose-600" icon={CreditCard} trend="Udhaar" />
        <StatCard label="Khata Accounts" value={state.customers.length} color="text-emerald-600" icon={Users} trend="Active" />
        <StatCard label="Inventory Stock" value={state.products.length} color="text-blue-600" icon={Package} trend="Items" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" /> Recent Ledger Activity
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'PURCHASE' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {tx.type === 'PURCHASE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{state.customers.find(c => c.id === tx.customerId)?.name || 'Walk-in'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">{tx.description}</p>
                  </div>
                </div>
                <p className={`font-black text-lg ${tx.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {tx.type === 'PURCHASE' ? '+' : '-'}₹{tx.amount}
                </p>
              </div>
            ))}
            {recentTx.length === 0 && <p className="text-center py-12 text-slate-400 italic">No transactions recorded</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-400" /> High Credit Alerts
            </h3>
          </div>
          <div className="space-y-4">
            {state.customers
              .filter(c => c.outstandingBalance > 0)
              .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
              .slice(0, 5)
              .map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-rose-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{c.name[0]}</div>
                    <div><p className="font-bold text-slate-900">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div>
                  </div>
                  <div className="text-right"><p className="font-black text-rose-600 text-lg">₹{c.outstandingBalance}</p></div>
                </div>
              ))}
              {state.customers.filter(c => c.outstandingBalance > 0).length === 0 && (
                <div className="h-48 flex items-center justify-center text-slate-400 italic">No outstanding balances!</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryView = ({ products, onAdd }: any) => {
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'General' });

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Shop Inventory</h2>
          <p className="text-slate-500 font-medium">Manage stock and sale prices</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
          <Plus className="w-5 h-5" /> New Item
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-emerald-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Search items by name or category..." 
          className="w-full pl-16 pr-6 py-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-xl font-bold"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((p: any) => (
          <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-wider">{p.category}</span>
              <p className="font-black text-3xl text-slate-900 group-hover:text-emerald-600 transition-colors">₹{p.price}</p>
            </div>
            <h4 className="font-bold text-xl text-slate-800 leading-tight mb-2">{p.name}</h4>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors">Edit</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-24 text-center text-slate-400 italic">No products found</div>}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black">Add Product</h3>
              <button onClick={() => setModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form className="space-y-6" onSubmit={e => {
              e.preventDefault();
              onAdd({ ...form, price: parseFloat(form.price) });
              setModal(false);
              setForm({ name: '', price: '', category: 'General' });
            }}>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest block pl-2">Product Name</label>
                <input required autoFocus className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Rice 1kg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest block pl-2">Price (₹)</label>
                  <input required type="number" className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest block pl-2">Category</label>
                  <select className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all appearance-none" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option>General</option><option>Grains</option><option>Dairy</option><option>Essentials</option><option>Spices</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all mt-4">Save Product</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomersView = ({ customers, transactions, onAddCustomer, onAddTx }: any) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'customer' | 'tx' | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', amount: '', desc: '', type: 'PURCHASE' as TransactionType });
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedC = customers.find((c: any) => c.id === selectedId);
  const history = transactions.filter((t: any) => t.customerId === selectedId);

  const handleScan = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const items = await extractItemsFromImage(base64);
      const total = items.reduce((acc, i) => acc + i.price, 0);
      const desc = items.map(i => i.name).join(', ');
      setForm({ ...form, amount: total.toString(), desc: `AI Scan: ${desc}`, type: 'PURCHASE' });
      setIsScanning(false);
      setModalType('tx');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
      <div className="lg:col-span-4 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ledger Books</h2>
          <button onClick={() => setModalType('customer')} className="w-12 h-12 bg-emerald-600 text-white rounded-[1.2rem] shadow-lg shadow-emerald-500/20 flex items-center justify-center hover:bg-emerald-700 transition-all"><UserPlus className="w-6 h-6" /></button>
        </div>
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
          {customers.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full text-left p-6 rounded-[2.5rem] transition-all border-2 ${selectedId === c.id ? 'bg-white border-emerald-500 shadow-xl -translate-y-1' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${selectedId === c.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{c.name[0]}</div>
                  <div><p className="font-black text-slate-800 leading-none mb-1">{c.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{c.phone}</p></div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{c.outstandingBalance}</p>
                </div>
              </div>
            </button>
          ))}
          {customers.length === 0 && <div className="text-center py-24 text-slate-300 italic border-2 border-dashed rounded-[3rem]">No accounts yet</div>}
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedC ? (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-24 -mt-24"></div>
               <div className="flex flex-col md:flex-row justify-between md:items-center gap-8 mb-10 relative z-10">
                 <div><h3 className="text-4xl font-black text-slate-900 tracking-tight">{selectedC.name}</h3><p className="text-slate-400 font-bold uppercase text-xs mt-2 tracking-widest flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedC.phone}</p></div>
                 <div className="flex flex-wrap gap-2">
                   <button onClick={() => fileRef.current?.click()} className={`p-5 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center gap-2 font-black text-sm hover:bg-indigo-100 active:scale-95 transition-all ${isScanning ? 'animate-pulse' : ''}`} disabled={isScanning}>
                     {isScanning ? 'SCANNING...' : <><Camera className="w-5 h-5" /> AI SCAN</>}
                   </button>
                   <input type="file" ref={fileRef} hidden onChange={handleScan} accept="image/*" />
                   <button onClick={() => { setForm({...form, type: 'PURCHASE', amount: '', desc: ''}); setModalType('tx'); }} className="px-6 py-5 bg-rose-50 text-rose-600 font-black rounded-[1.5rem] text-sm hover:bg-rose-100 active:scale-95 transition-all">UDHAAR (+)</button>
                   <button onClick={() => { setForm({...form, type: 'PAYMENT', amount: '', desc: ''}); setModalType('tx'); }} className="px-6 py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">PAID (-)</button>
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-rose-50/50 p-8 rounded-[2.5rem] border border-rose-100 group transition-all hover:shadow-lg">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Total Udhaar</p>
                    <p className="text-5xl font-black text-rose-600">₹{selectedC.outstandingBalance}</p>
                 </div>
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                    <p className="text-2xl font-black text-slate-800">{new Date(selectedC.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Updated via manual entry</p>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 bg-slate-50/50 border-b flex items-center gap-2">
                 <Clock className="w-5 h-5 text-slate-400" />
                 <span className="font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">Transaction Timeline</span>
               </div>
               <div className="divide-y divide-slate-50">
                 {history.map((tx: any) => (
                   <div key={tx.id} className="p-8 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${tx.type === 'PURCHASE' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {tx.type === 'PURCHASE' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownLeft className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-lg leading-tight mb-1">{tx.description || (tx.type === 'PURCHASE' ? 'Purchase' : 'Settlement')}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black ${tx.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-600'}`}>{tx.type === 'PURCHASE' ? '+' : '-'}₹{tx.amount}</p>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Balance Impact</span>
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && <div className="py-24 text-center text-slate-300 italic">No transactions in history</div>}
               </div>
            </div>
          </div>
        ) : <div className="h-96 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <Users className="w-16 h-16 mb-6 opacity-20" />
          <h3 className="text-2xl font-black text-slate-900">Select an Account</h3>
          <p className="text-sm font-medium mt-1 text-slate-400">Click a customer on the left to manage their ledger</p>
        </div>}
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-3xl font-black tracking-tight">{modalType === 'customer' ? 'New Account' : (form.type === 'PURCHASE' ? 'Record Sale' : 'Settle Payment')}</h3>
              <button onClick={() => setModalType(null)} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form className="space-y-6" onSubmit={e => {
              e.preventDefault();
              if(modalType === 'customer') onAddCustomer({ name: form.name, phone: form.phone });
              else onAddTx({ customerId: selectedId, type: form.type, amount: parseFloat(form.amount), description: form.desc });
              setModalType(null);
              setForm({ name: '', phone: '', amount: '', desc: '', type: 'PURCHASE' });
            }}>
              {modalType === 'customer' ? (
                <>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Customer Name</label><input required className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ramesh Kumar" /></div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Phone Number</label><input required className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="98XXXXXXXX" /></div>
                </>
              ) : (
                <>
                  <div className="text-center bg-slate-50/50 p-10 rounded-[2.5rem] mb-6 border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-4">Transaction Amount</label>
                    <div className="relative inline-flex items-center">
                      <span className="text-5xl font-black text-slate-300 mr-2">₹</span>
                      <input required autoFocus type="number" className="bg-transparent text-6xl font-black text-slate-900 outline-none w-52 text-center" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 ml-2">Entry Details</label><textarea className="w-full p-5 border-2 border-slate-100 rounded-3xl font-bold text-lg focus:border-emerald-500 outline-none transition-all" rows={3} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Milk, Bread, Tea..." /></div>
                </>
              )}
              <button type="submit" className={`w-full py-7 rounded-[2rem] font-black text-2xl text-white shadow-2xl transition-all active:scale-95 ${modalType === 'customer' || form.type === 'PAYMENT' ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-rose-600 shadow-rose-600/30'}`}>
                {modalType === 'customer' ? 'Create Khata' : (form.type === 'PURCHASE' ? 'Update Udhaar' : 'Settle Payment')}
              </button>
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