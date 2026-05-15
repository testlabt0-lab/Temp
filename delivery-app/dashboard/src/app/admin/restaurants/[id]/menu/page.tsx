'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MenuManagement() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantAndMenu();
    }
  }, [restaurantId]);

  async function fetchRestaurantAndMenu() {
    try {
      setLoading(true);
      const [restRes, menuRes] = await Promise.all([
        supabase.from('restaurants').select('*').eq('id', restaurantId).single(),
        supabase.from('menu_items').select('*').eq('restaurant_id', restaurantId).order('created_at', { ascending: false })
      ]);

      if (restRes.error) throw restRes.error;
      if (menuRes.error) throw menuRes.error;

      setRestaurant(restRes.data);
      setMenuItems(menuRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      alert('Failed to load menu data.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center mb-6 space-x-4">
        <button onClick={() => router.push('/admin/restaurants')} className="text-gray-600 hover:text-gray-900">
          ← Back
        </button>
        <h1 className="text-2xl font-bold flex-1">Menu for {restaurant?.name || '...'}</h1>
        <Link
          href={`/admin/restaurants/${restaurantId}/menu/new`}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition duration-150"
        >
          Add Menu Item
        </Link>
      </div>

      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No items in this menu yet.
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.is_available ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-4" onClick={() => alert('Add modifiers feature coming soon!')}>Add Modifiers</button>
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
