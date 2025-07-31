'use client';

import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@/lib/supabaseClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
