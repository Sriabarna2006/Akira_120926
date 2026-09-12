import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { LiveTrendingPage } from './pages/LiveTrendingPage';
import { AllNewsPage } from './pages/AllNewsPage';
import { DailyBriefPage } from './pages/DailyBriefPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { LearnPage } from './pages/LearnPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { LibraryPage } from './pages/LibraryPage';
import { SearchPage } from './pages/SearchPage';
import { CategoryPage } from './pages/CategoryPage';
import { ProfilePage } from './pages/ProfilePage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="live" element={<LiveTrendingPage />} />
            <Route path="all-news" element={<AllNewsPage />} />
            <Route path="daily-brief" element={<DailyBriefPage />} />
            <Route path="explore" element={<AllNewsPage />} />
            <Route path="event/:id" element={<EventDetailPage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="knowledge" element={<KnowledgePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
