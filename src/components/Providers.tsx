'use client';

import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createClient } from '@/lib/supabaseClient';
import theme from '@/lib/theme';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionContextProvider supabaseClient={supabase}>
        {children}
      </SessionContextProvider>
    </ThemeProvider>
  );
}
