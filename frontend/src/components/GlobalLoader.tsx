import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Slide } from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';

const LOADING_QUOTES = [
  "Loading...",
  "Getting things from server...",
  "Your data is loading...",
  "In a while it will resolve...",
  "Synchronizing database records...",
  "Retrieving latest transaction updates...",
  "Just a moment, securing connection...",
  "Almost there, finalizing data..."
];

export const GlobalLoader: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<any>(null);

  // Listen for api-loading events
  useEffect(() => {
    const handleApiLoading = (e: Event) => {
      const isLoading = (e as CustomEvent).detail.loading;
      setLoading(isLoading);
    };

    window.addEventListener('api-loading', handleApiLoading);
    return () => {
      window.removeEventListener('api-loading', handleApiLoading);
    };
  }, []);

  // Cycle quotes every 2 seconds while loading
  useEffect(() => {
    if (loading) {
      // Pick a random starting quote
      setQuoteIndex(0);
      setAnimating(false);

      intervalRef.current = setInterval(() => {
        // Trigger exit animation
        setAnimating(true);

        // After exit animation completes, swap text and trigger enter animation
        setTimeout(() => {
          setQuoteIndex((prev) => {
            let next = prev;
            while (next === prev) {
              next = Math.floor(Math.random() * LOADING_QUOTES.length);
            }
            return next;
          });
          setAnimating(false);
        }, 300);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 12, sm: 20 },
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Slide in={loading} direction="down" mountOnEnter unmountOnExit>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: 'rgba(15, 118, 110, 0.95)',
            color: '#ffffff',
            px: 2.5,
            py: 1.2,
            borderRadius: '50px',
            boxShadow: '0 4px 24px 0 rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(10px)',
            maxWidth: '90vw',
            width: 'max-content',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          <SyncIcon
            sx={{
              animation: 'spin 1.5s linear infinite',
              fontSize: '1.1rem',
              color: 'inherit',
              flexShrink: 0,
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              textAlign: 'center',
              lineHeight: 1.2,
              opacity: animating ? 0 : 1,
              transform: animating ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {LOADING_QUOTES[quoteIndex]}
          </Typography>
        </Box>
      </Slide>
    </Box>
  );
};

export default GlobalLoader;
