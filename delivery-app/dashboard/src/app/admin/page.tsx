export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-800">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block py-2 px-4 bg-gray-800 rounded">Overview</a>
          <a href="#" className="block py-2 px-4 hover:bg-gray-800 rounded">Restaurants</a>
          <a href="#" className="block py-2 px-4 hover:bg-gray-800 rounded">Orders</a>
          <a href="#" className="block py-2 px-4 hover:bg-gray-800 rounded">Users</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Total Orders</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">1,248</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Active Restaurants</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">34</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium uppercase">Active Drivers</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">56</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Orders</h2>
          <p className="text-gray-600">No orders to display yet.</p>
        </div>
      </main>
    </div>
  );
}
