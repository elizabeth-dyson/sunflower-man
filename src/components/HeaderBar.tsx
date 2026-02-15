'use client';

import { PropsWithChildren } from 'react';
import { Box, Container, Typography } from '@mui/material';
import LogoutButton from '@/components/LogoutButton';
import BackButton from '@/components/BackButton';

type HeaderBarProps = {
  title: string;
  emoji?: string;
};

export default function HeaderBar({ title, emoji = '🌻' }: PropsWithChildren<HeaderBarProps>) {
  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        mb: 4,
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
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
                letterSpacing: '-0.01em',
                color: 'primary.dark',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '12px',
                  bgcolor: 'success.light',
                  fontSize: '1.4rem',
                  lineHeight: 1,
                }}
              >
                {emoji}
              </Box>
              {title}
            </Typography>
          </Box>

          <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center' }}>
            <LogoutButton />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
