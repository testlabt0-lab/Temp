import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Delivery App Dashboard</h1>
        <p className="text-gray-600 mb-8">Manage restaurants, menus, and orders.</p>
        <div className="space-y-4">
          <Link href="/login" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
