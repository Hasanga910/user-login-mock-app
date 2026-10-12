export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
