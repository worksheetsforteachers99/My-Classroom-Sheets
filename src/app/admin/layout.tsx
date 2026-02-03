export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-500">Admin</div>
          <a className="text-sm text-blue-600 hover:underline" href="/products">
            View Store
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">{children}</div>
    </div>
  );
}

