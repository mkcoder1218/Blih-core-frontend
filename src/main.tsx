import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RootApp from './RootApp';
import PublicPolicyPage from './pages/PublicPolicyPage';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertProvider } from './contexts/AlertContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider, ensureLocalizedPath } from './i18n';
import { installSystemTextBridge } from './i18n/systemTextBridge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

ensureLocalizedPath();
installSystemTextBridge();

const isPublicPolicyPage = /^\/(?:en|am|ti|om)\/policies\/share\/[^/?#]+\/?$/i.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AlertProvider>
            {isPublicPolicyPage ? <PublicPolicyPage /> : <RootApp />}
          </AlertProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
