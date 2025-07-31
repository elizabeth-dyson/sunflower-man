// supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const createServerSupabaseClient = async () => {
  const cookieStore = cookies(); // ✅ this is now safe as long as you await cookieStore.get() inside

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name: string) => {
          // ✅ must await cookieStore.get()
          // @ts-expect-error Supabase types don't support async cookie getters yet
          return (await cookieStore.get(name))?.value as string | undefined;
        },
      },
    }
  );
};
