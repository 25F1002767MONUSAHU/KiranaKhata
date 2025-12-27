
import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Layout } from '../components/Layout';
import { Dashboard } from '../views/Dashboard';
import { Inventory } from '../views/Inventory';
import { Customers } from '../views/Customers';
import { Product, Customer, Transaction, KiranaState } from '../types';

const INITIAL_STATE: KiranaState = {
  products: [
    { id: '1', name: 'Basmati Rice 1kg', price: 120, category: 'Grains' },
    { id: '2', name: 'Tata Salt 1kg', price: 25, category: 'Spices' },
    { id: '3', name: 'Fortune Oil 1L', price: 185, category: 'Essentials' },
  ],
  customers: [
    { id: 'c1', name: 'Rahul Sharma', phone: '9876543210', outstandingBalance: 450, lastUpdated: Date.now() },
    { id: 'c2', name: 'Priya Verma', phone: '9123456780', outstandingBalance: 0, lastUpdated: Date.now() },
  ],
  transactions: []
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'customers'>('dashboard');
  const [viewMode, setViewMode] = useState<'shopkeeper' | 'customer'>('shopkeeper');
  const [state, setState] = useState<KiranaState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kirana_data');
    if (saved) {
      setState(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('kirana_data', JSON.stringify(state));
    }
  }, [state, isLoaded]);

  useEffect(() => {
    if (viewMode === 'customer' && activeTab !== 'customers') {
      setActiveTab('customers');
    }
  }, [viewMode, activeTab]);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  }, []);

  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'outstandingBalance' | 'lastUpdated'>) => {
    const newCustomer: Customer = { 
      ...customer, 
      id: Math.random().toString(36).substr(2, 9),
      outstandingBalance: 0,
      lastUpdated: Date.now()
    };
    setState(prev => ({ ...prev, customers: [...prev.customers, newCustomer] }));
  }, []);

  const recordTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
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
  }, []);

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading Khata...</div>;

  return (
    <>
      <Head>
        <title>KiranaKhata - Smart Digital Ledger</title>
        <meta name="description" content="Manage your kirana shop inventory and customer credit efficiently." />
      </Head>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        viewMode={viewMode} 
        setViewMode={setViewMode}
      >
        {activeTab === 'dashboard' && viewMode === 'shopkeeper' && (
          <Dashboard 
            state={state} 
            onAddTransaction={recordTransaction} 
          />
        )}
        {activeTab === 'inventory' && viewMode === 'shopkeeper' && (
          <Inventory 
            products={state.products} 
            onAddProduct={addProduct} 
          />
        )}
        {activeTab === 'customers' && (
          <Customers 
            customers={state.customers} 
            transactions={state.transactions}
            products={state.products}
            onAddCustomer={addCustomer}
            onAddTransaction={recordTransaction}
            isShopkeeper={viewMode === 'shopkeeper'}
          />
        )}
      </Layout>
    </>
  );
}
