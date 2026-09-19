import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { LiveTrendingPage } from './pages/LiveTrendingPage';
import { DailyBriefPage } from './pages/DailyBriefPage';
import { ExplorePage } from './pages/ExplorePage';
import { LearnPage } from './pages/LearnPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { LibraryPage } from './pages/LibraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ConceptDetailPage } from './pages/ConceptDetailPage';
import { AllNewsPage } from './pages/AllNewsPage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AuthModal />
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* 8 Primary Navigation Routes (Phase 2 Spec) */}
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Navigate to="/" replace />} />
                <Route path="live" element={<LiveTrendingPage />} />
                <Route path="daily-brief" element={<DailyBriefPage />} />
                <Route path="explore" element={<ExplorePage />} />
                <Route path="learn" element={<LearnPage />} />
                <Route path="library" element={<LibraryPage />} />
                <Route path="knowledge" element={<KnowledgePage />} />
                <Route path="profile" element={<ProfilePage />} />

                {/* Detail & Filter Routes */}
                <Route path="event/:id" element={<EventDetailPage />} />
                <Route path="concept/:id" element={<ConceptDetailPage />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="all-news" element={<AllNewsPage />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
