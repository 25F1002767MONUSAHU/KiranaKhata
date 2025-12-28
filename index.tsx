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
  Clock
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

// --- Initial Data ---
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
          { text: "Extract grocery items and their prices from this handwritten list or receipt. Return ONLY a JSON array of objects with 'name' and 'price'. If price is missing, use 0." },
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

// --- UI Components ---

const StatCard = ({ label, value, color, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
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

// --- Main App ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'customers'>('dashboard');
  const [state, setState] = useState<KiranaState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('kirana_pro_data');
    if (saved) {
      try { setState(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem('kirana_pro_data', JSON.stringify(state));
  }, [state, isLoaded]);

  // Actions
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

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-black text-2xl animate-pulse tracking-tighter">KIRANAKHATA PRO</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r h-screen fixed left-0 top-0 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Store className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none">KiranaKhata</h1>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Premium Ledger</span>
          </div>
        </div>

        <nav className="space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Dashboard" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Package} label="Inventory" />
          <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={Users} label="Khata Books" />
        </nav>

        <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shop Profile</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs">🏪</div>
            <p className="font-bold text-sm">Apna General Store</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-72 p-6 md:p-12 max-w-6xl mx-auto">
        {activeTab === 'dashboard' && <DashboardView state={state} />}
        {activeTab === 'inventory' && <InventoryView products={state.products} onAdd={addProduct} />}
        {activeTab === 'customers' && <CustomersView 
          customers={state.customers} 
          transactions={state.transactions} 
          onAddCustomer={addCustomer} 
          onAddTx={recordTransaction} 
        />}
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-4 z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={LayoutDashboard} label="Home" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Package} label="Items" />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={Users} label="Khata" />
      </nav>
    </div>
  );
};

// --- View: Dashboard ---
const DashboardView = ({ state }: { state: KiranaState }) => {
  const totalUdhaar = state.customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const recentTx = state.transactions.slice(0, 5);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Business Overview</h2>
        <p className="text-slate-500 font-medium">Real-time status of your shop</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Udhaar (Credit)" value={`₹${totalUdhaar}`} color="text-rose-600" icon={CreditCard} trend="Action Required" />
        <StatCard label="Active Khata Accounts" value={state.customers.length} color="text-blue-600" icon={Users} />
        <StatCard label="In-Stock Items" value={state.products.length} color="text-emerald-600" icon={Package} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
          </h3>
          <div className="space-y-4">
            {recentTx.map(tx => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'PURCHASE' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {tx.type === 'PURCHASE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{state.customers.find(c => c.id === tx.customerId)?.name || 'Walk-in'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{tx.description}</p>
                  </div>
                </div>
                <p className={`font-black text-lg ${tx.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {tx.type === 'PURCHASE' ? '+' : '-'}₹{tx.amount}
                </p>
              </div>
            ))}
            {recentTx.length === 0 && <p className="text-center py-12 text-slate-400 italic">No transactions recorded today</p>}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-black mb-6">Top Credit Customers</h3>
          <div className="space-y-4">
            {state.customers
              .filter(c => c.outstandingBalance > 0)
              .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
              .slice(0, 5)
              .map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{c.name[0]}</div>
                    <div><p className="font-bold text-slate-900">{c.name}</p><p className="text-[10px] text-slate-400">{c.phone}</p></div>
                  </div>
                  <div className="text-right"><p className="font-black text-rose-600">₹{c.outstandingBalance}</p></div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View: Inventory ---
const InventoryView = ({ products, onAdd }: any) => {
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: 'General' });

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Inventory</h2>
          <p className="text-slate-500 font-medium">Manage your products and pricing</p>
        </div>
        <button onClick={() => setModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search items..." 
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg font-medium"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p: any) => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500">{p.category}</span>
              <p className="font-black text-2xl text-slate-900 group-hover:text-emerald-600 transition-colors">₹{p.price}</p>
            </div>
            <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">New Product</h3>
              <button onClick={() => setModal(false)}><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form className="space-y-6" onSubmit={e => {
              e.preventDefault();
              onAdd({ ...form, price: parseFloat(form.price) });
              setModal(false);
              setForm({ name: '', price: '', category: 'General' });
            }}>
              <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Item Name</label><input required className="w-full p-4 border rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Milk 500ml" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Price</label><input required type="number" className="w-full p-4 border rounded-2xl font-bold" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" /></div>
                <div><label className="text-xs font-black uppercase text-slate-400 mb-2 block">Category</label><select className="w-full p-4 border rounded-2xl font-bold" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option>General</option><option>Grains</option><option>Dairy</option><option>Essentials</option>
                </select></div>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg">Save Item</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View: Customers (Khata) ---
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-4 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black">Khata Books</h2>
          <button onClick={() => setModalType('customer')} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><Plus className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {customers.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full text-left p-5 rounded-[2rem] transition-all border-2 ${selectedId === c.id ? 'bg-white border-emerald-500 shadow-lg -translate-y-1' : 'bg-white border-transparent hover:border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between">
                <div><p className="font-black text-slate-800">{c.name}</p><p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase mt-1"><Phone className="w-3 h-3" /> {c.phone}</p></div>
                <div className="text-right"><p className={`font-black ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₹{c.outstandingBalance}</p><p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Balance</p></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-8">
        {selectedC ? (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16"></div>
               <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 relative z-10">
                 <div><h3 className="text-3xl font-black">{selectedC.name}</h3><p className="text-slate-400 font-bold uppercase text-[11px] mt-1 tracking-widest">{selectedC.phone}</p></div>
                 <div className="flex gap-2">
                   <button onClick={() => fileRef.current?.click()} className={`p-4 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center gap-2 font-black text-sm active:scale-95 transition-all ${isScanning ? 'animate-pulse' : ''}`} disabled={isScanning}>
                     {isScanning ? 'SCANNING...' : <><Camera className="w-5 h-5" /> SCAN LIST</>}
                   </button>
                   <input type="file" ref={fileRef} hidden onChange={handleScan} accept="image/*" />
                   <button onClick={() => { setForm({...form, type: 'PURCHASE', amount: '', desc: ''}); setModalType('tx'); }} className="px-5 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl text-sm active:scale-95">UDHAAR (+)</button>
                   <button onClick={() => { setForm({...form, type: 'PAYMENT', amount: '', desc: ''}); setModalType('tx'); }} className="px-5 py-4 bg-emerald-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-600/20 active:scale-95">PAID (-)</button>
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Due Amount</p>
                    <p className="text-4xl font-black text-rose-600">₹{selectedC.outstandingBalance}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                    <p className="text-2xl font-bold text-slate-800">{new Date(selectedC.lastUpdated).toLocaleDateString()}</p>
                 </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 bg-slate-50/50 border-b font-black text-xs uppercase text-slate-400 tracking-widest">Transaction Records</div>
               <div className="divide-y divide-slate-50">
                 {history.map((tx: any) => (
                   <div key={tx.id} className="p-6 flex justify-between items-center group hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${tx.type === 'PURCHASE' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {tx.type === 'PURCHASE' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-none mb-1">{tx.description}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <p className={`text-xl font-black ${tx.type === 'PURCHASE' ? 'text-rose-600' : 'text-emerald-600'}`}>{tx.type === 'PURCHASE' ? '+' : '-'}₹{tx.amount}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        ) : <div className="h-96 flex flex-col items-center justify-center text-slate-300 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <Users className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-black text-slate-800">Select a Khata Account</h3>
          <p className="text-sm font-medium mt-1">Manage individual ledger books from the left list</p>
        </div>}
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 animate-in zoom-in duration-300 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black">{modalType === 'customer' ? 'New Account' : (form.type === 'PURCHASE' ? 'Record Udhaar' : 'Payment Received')}</h3>
              <button onClick={() => setModalType(null)}><X className="w-6 h-6 text-slate-400" /></button>
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
                  <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Customer Name</label><input required className="w-full p-4 border rounded-2xl font-bold" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label><input required className="w-full p-4 border rounded-2xl font-bold" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                </>
              ) : (
                <>
                  <div className="text-center bg-slate-50 p-6 rounded-3xl mb-4 border border-slate-100">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Transaction Amount</label>
                    <div className="relative inline-block">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-300">₹</span>
                      <input required autoFocus type="number" className="bg-transparent text-5xl font-black text-slate-900 outline-none w-48 text-center pl-8" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0" />
                    </div>
                  </div>
                  <div><label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Notes / Items</label><textarea className="w-full p-4 border rounded-2xl font-bold" rows={3} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Add list or note..." /></div>
                </>
              )}
              <button type="submit" className={`w-full py-5 rounded-[1.5rem] font-black text-xl text-white shadow-xl ${modalType === 'customer' || form.type === 'PAYMENT' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'}`}>
                {modalType === 'customer' ? 'Create Account' : (form.type === 'PURCHASE' ? 'Update Khata (+)' : 'Settle Payment (-)')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Helpers ---
const NavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50'}`}>
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} /> {label}
  </button>
);

const MobileNavItem = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}>
    <Icon className="w-5 h-5" />
    <span className="text-[9px] font-black uppercase mt-1 tracking-widest">{label}</span>
  </button>
);

// --- Render ---
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}