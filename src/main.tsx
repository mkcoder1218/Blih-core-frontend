import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';
import PublicPolicyPage from './pages/PublicPolicyPage';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const isPublicPolicyPage = /^\/policies\/share\/[^/?#]+\/?$/i.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          {isPublicPolicyPage ? <PublicPolicyPage /> : <RootApp />}
        </AlertProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
