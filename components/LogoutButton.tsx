export default function LogoutButton({ className }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={
          className ??
          'rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100'
        }
      >
        Log out
      </button>
    </form>
  );
}
