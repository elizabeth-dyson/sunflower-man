'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // redirect to login screen after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="text-red-600 font-semibold underline hover:text-red-800"
    >
      Log out
    </button>
  );
}
