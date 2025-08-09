'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1 text-red-600 font-semibold hover:underline leading-none py-1"
    >
      Log out
    </button>
  );
}
