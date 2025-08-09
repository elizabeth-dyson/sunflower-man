'use client';

import { PropsWithChildren } from 'react';
import { Box, Button, Container, Divider, Typography } from '@mui/material';
import LogoutButton from '@/components/LogoutButton';
import BackButton from '@/components/BackButton';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type HeaderBarProps = {
  title: string;
  emoji?: string;
};

export default function HeaderBar({ title, emoji = '🌻' }: PropsWithChildren<HeaderBarProps>) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <Box sx={{ position: 'relative', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center', // ensures vertical alignment
            gap: 2,
          }}
          >
          <Box sx={{ justifySelf: 'start', display: 'flex', alignItems: 'center' }}>
            <BackButton />
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Typography
            component="h1"
            variant="h4"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: 'success.dark',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
            }}
            >
            <span style={{ fontSize: '1.35em', lineHeight: 0 }}>{emoji}</span>
            {title}
            </Typography>
          </Box>

          <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
            <LogoutButton />
          </Box>
        </Box>
      </Container>
      <Divider />
      <Divider sx={{ mb: 3 }} />
    </Box>
  );
}