import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-2xl font-bold border-b border-gray-800">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block py-2 px-4 hover:bg-gray-800 rounded">Overview</Link>
          <Link href="/admin/restaurants" className="block py-2 px-4 hover:bg-gray-800 rounded">Restaurants</Link>
          <Link href="/admin/orders" className="block py-2 px-4 hover:bg-gray-800 rounded">Orders</Link>
          <Link href="/admin/users" className="block py-2 px-4 hover:bg-gray-800 rounded">Users</Link>
          <Link href="/admin/promos" className="block py-2 px-4 hover:bg-gray-800 rounded">Promos</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
