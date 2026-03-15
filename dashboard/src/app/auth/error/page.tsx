import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary">
      <div className="card w-full max-w-sm p-8 text-center">
        <h1 className="font-display text-3xl text-accent-red mb-2">Access Denied</h1>
        <p className="text-text-secondary text-sm mb-8">
          This account is not authorized to access AI OS.
        </p>
        <Link href="/auth/signin" className="btn-primary">
          Try Another Account
        </Link>
      </div>
    </div>
  );
}
