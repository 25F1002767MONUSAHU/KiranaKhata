
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'inventory' | 'customers';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'customers') => void;
  viewMode: 'shopkeeper' | 'customer';
  setViewMode: (mode: 'shopkeeper' | 'customer') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, viewMode, setViewMode }) => {
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
            onClick={() => setViewMode('customer')}
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

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">👤</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">General Store</p>
              <p className="text-[10px] text-slate-500">Verified Merchant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0,0.05)]">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Home" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="📦" label="Items" />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="👥" label="Khata" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

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
