export default function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
      <p className="text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-indigo-300">{detail}</p>}
    </div>
  );
}
