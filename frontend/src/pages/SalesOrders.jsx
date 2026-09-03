import { useState } from 'react';
import OrdersManage from './OrdersManage';
import MyOrders from './MyOrders';

const tabCls = (active) =>
  `rounded-full border px-4 py-2 text-sm font-bold transition ${
    active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
  }`;

/**
 * Sales Person's orders hub — two views:
 *  1. Orders containing MY products (backend-scoped GET /api/orders)
 *  2. My own purchases (GET /api/orders/mine) — sales persons can shop too
 */
export default function SalesOrders() {
  const [tab, setTab] = useState('selling');

  return (
    <div>
      <div className="mx-auto flex w-full max-w-6xl gap-2.5 px-5 pt-6">
        <button className={tabCls(tab === 'selling')} onClick={() => setTab('selling')}>💼 Orders of my products</button>
        <button className={tabCls(tab === 'buying')} onClick={() => setTab('buying')}>🛍 My purchases</button>
      </div>
      {tab === 'selling' ? <OrdersManage mode="sales" /> : <MyOrders />}
    </div>
  );
}
