
import React from 'react';
import { KiranaState, Transaction } from '../types';

interface DashboardProps {
  state: KiranaState;
  onAddTransaction: (tx: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const totalCredit = state.customers.reduce((acc, c) => acc + c.outstandingBalance, 0);
  const recentTransactions = state.transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Store Overview</h2>
        <p className="text-slate-500">Welcome back, Shopkeeper</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Credit (Udhaar)" 
          value={`₹${totalCredit.toLocaleString()}`} 
          color="text-red-600" 
          bg="bg-red-50"
          icon="💳"
        />
        <StatCard 
          label="Active Customers" 
          value={state.customers.length.toString()} 
          color="text-blue-600" 
          bg="bg-blue-50"
          icon="👥"
        />
        <StatCard 
          label="Products in Shop" 
          value={state.products.length.toString()} 
          color="text-emerald-600" 
          bg="bg-emerald-50"
          icon="📦"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      tx.type === 'PURCHASE' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {tx.type === 'PURCHASE' ? 'OUT' : 'IN'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {state.customers.find(c => c.id === tx.customerId)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'PURCHASE' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'PURCHASE' ? '+' : '-'} ₹{tx.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-400 italic">No transactions yet</div>
            )}
          </div>
        </section>

        {/* Customer Balances */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Highest Credit Customers</h3>
          </div>
          <div className="p-4 space-y-4">
            {state.customers
              .filter(c => c.outstandingBalance > 0)
              .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
              .slice(0, 5)
              .map(customer => (
                <div key={customer.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                   <div>
                    <p className="font-medium text-slate-900">{customer.name}</p>
                    <p className="text-xs text-slate-500">{customer.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">₹{customer.outstandingBalance}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Outstanding</p>
                  </div>
                </div>
              ))}
              {state.customers.filter(c => c.outstandingBalance > 0).length === 0 && (
                <p className="text-center p-6 text-slate-400">All balances cleared! 🥳</p>
              )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, bg, icon }: any) => (
  <div className={`${bg} p-6 rounded-2xl border border-transparent hover:border-slate-200 transition-all cursor-default`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
  </div>
);
