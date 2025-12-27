
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'inventory' | 'customers';
  setActiveTab: (tab: 'dashboard' | 'inventory' | 'customers') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-xl">K</div>
          <h1 className="text-xl font-bold tracking-tight">KiranaKhata</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Dashboard" />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="📦" label="Inventory" />
          <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="👥" label="Customers" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-400">Version 1.0.0</p>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-3 z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon="📊" label="Home" />
        <MobileNavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon="📦" label="Items" />
        <MobileNavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon="👥" label="Khata" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-800 text-slate-300'
    }`}
  >
    <span>{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 ${active ? 'text-emerald-600' : 'text-slate-400'}`}
  >
    <span className="text-xl">{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);
