'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function LoginPage() {
  const router = useRouter();
  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (session) {
      router.push('/admin');
    }
  }, [session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl shadow-md">
            🌻
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-dark">
            The Sunflower Man
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Admin Portal
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-border-light bg-surface p-8 shadow-sm">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2e7d32',
                    brandAccent: '#1b5e20',
                    inputBorder: '#d4ddd4',
                    inputBorderHover: '#4caf50',
                    inputBorderFocus: '#2e7d32',
                    inputBackground: '#f8faf8',
                  },
                  radii: {
                    borderRadiusButton: '10px',
                    inputBorderRadius: '10px',
                  },
                  fonts: {
                    bodyFontFamily: 'var(--font-geist-sans), Inter, sans-serif',
                    buttonFontFamily: 'var(--font-geist-sans), Inter, sans-serif',
                    inputFontFamily: 'var(--font-geist-sans), Inter, sans-serif',
                    labelFontFamily: 'var(--font-geist-sans), Inter, sans-serif',
                  },
                },
              },
            }}
            theme="default"
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
}
