import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Layout components
import { Header, Footer } from './components/common';
import { HreflangTags, CountrySlugRedirect } from './components/seo';

// Pages
import {
  // Static pages
  AboutPage, MethodologyPage, PrivacyPage, TermsPage, ContactPage,
  // SEO Landing pages
  TopYouTubeChannelsPage, MostSubscribedYouTubeChannelsPage,
  YouTubeSubscriberRankingPage, TopYouTubeChannelsByCountryPage,
  // Main pages
  HomePage, LeaderboardPage, Top100Page,
  CountriesPage, CountryPage, ChannelPage,
  TrendingPage, RacePage, MilestonePage,
  CategoryListPage, CategoryPage,
  RisingStarsPage, ComparePage,
  // User pages
  AuthCallbackPage, ChannelRequestPage, PollsPage, AlertsPage, FavoritesPage,
  // Blog pages
  BlogPage, BlogPostPage, CountryBlogPostPage, BlogAdminPage,
  // Admin
  AdminPage,
  // Widget
  WidgetPage,
} from './pages';

import './i18n';

// Main App Content
function AppContent() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration.scope);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="App min-h-screen">
      <BrowserRouter>
        <HreflangTags />
        <Header />
        <main className="min-h-[calc(100vh-200px)]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/top-100" element={<Top100Page />} />
            {/* SEO Landing Pages */}
            <Route path="/top-youtube-channels" element={<TopYouTubeChannelsPage />} />
            <Route path="/most-subscribed-youtube-channels" element={<MostSubscribedYouTubeChannelsPage />} />
            <Route path="/youtube-subscriber-ranking" element={<YouTubeSubscriberRankingPage />} />
            <Route path="/top-youtube-channels-by-country" element={<TopYouTubeChannelsByCountryPage />} />
            <Route path="/countries" element={<CountriesPage />} />
            <Route path="/country/:countryCode" element={<CountryPage />} />
            <Route path="/channel/:channelId" element={<ChannelPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/race" element={<RacePage />} />
            <Route path="/milestones" element={<MilestonePage />} />
            <Route path="/categories" element={<CategoryListPage />} />
            <Route path="/category/:categorySlug" element={<CategoryPage />} />
            <Route path="/rising-stars" element={<RisingStarsPage />} />
            <Route path="/request-channel" element={<ChannelRequestPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/country/:countryCode" element={<CountryBlogPostPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/admin/blog" element={<BlogAdminPage />} />
            <Route path="/widgets" element={<WidgetPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* SEO-friendly country slug redirects */}
            <Route path="/:slug" element={<CountrySlugRedirect />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

// Main App with Providers
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
