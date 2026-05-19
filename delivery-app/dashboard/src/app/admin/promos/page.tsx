'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PromosManagement() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    max_discount_amount: '',
    min_order_amount: '',
    valid_until: '',
    usage_limit: '',
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  async function fetchPromos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching promos:', error);
      else setPromos(data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('promo_codes').insert([{
        code: formData.code.toUpperCase(),
        discount_percentage: parseFloat(formData.discount_percentage),
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        valid_until: new Date(formData.valid_until).toISOString(),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      }]);

      if (error) throw error;

      setShowModal(false);
      fetchPromos();
    } catch (err: any) {
      alert('Error creating promo: ' + err.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-150"
        >
          Create Promo Code
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promos.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No promo codes found.</td></tr>
              ) : (
                promos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{p.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.discount_percentage}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${p.max_discount_amount || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.times_used} / {p.usage_limit || '∞'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.valid_until).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for creating promo code */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Promo Code</h2>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code (e.g. SUMMER20)</label>
                <input required type="text" className="w-full border p-2 rounded uppercase" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount %</label>
                <input required type="number" step="0.01" max="100" className="w-full border p-2 rounded" value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Discount Amount ($) - Optional</label>
                <input type="number" step="0.01" className="w-full border p-2 rounded" value={formData.max_discount_amount} onChange={e => setFormData({...formData, max_discount_amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Valid Until</label>
                <input required type="date" className="w-full border p-2 rounded" value={formData.valid_until} onChange={e => setFormData({...formData, valid_until: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
