import Link from 'next/link';

export default function InvalidLink() {
  return (
    <div className="space-y-4">
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">This link is invalid or has expired.</p>
      <Link href="/forgot-password" className="btn-primary">Request a new link</Link>
    </div>
  );
}
