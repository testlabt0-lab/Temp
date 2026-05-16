'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeRestaurants: 0,
    totalSales: 0,
    recentOrders: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);

      // Fetch aggregate data
      const [ordersRes, restaurantsRes, salesRes] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('total_amount').eq('status', 'delivered')
      ]);

      // Calculate total sales
      let sales = 0;
      if (salesRes.data) {
        sales = salesRes.data.reduce((sum, order) => sum + Number(order.total_amount), 0);
      }

      // Fetch recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*, restaurants(name), profiles!orders_customer_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalOrders: ordersRes.count || 0,
        activeRestaurants: restaurantsRes.count || 0,
        totalSales: sales,
        recentOrders: recent || []
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

      {loading ? (
        <p>Loading statistics...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Total Sales (Delivered)</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">${stats.totalSales.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Active Restaurants</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeRestaurants}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Orders</h2>
              <button onClick={fetchDashboardStats} className="text-sm text-blue-600 hover:text-blue-800">Refresh</button>
            </div>

            {stats.recentOrders.length === 0 ? (
              <p className="text-gray-600">No orders to display yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{order.id.substring(0,8)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{order.profiles?.full_name || 'Guest'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{order.restaurants?.name}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">${order.total_amount}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
