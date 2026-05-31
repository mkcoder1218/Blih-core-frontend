import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertProvider } from './contexts/AlertContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AlertProvider>
        <RootApp />
      </AlertProvider>
    </QueryClientProvider>
  </StrictMode>,
);
