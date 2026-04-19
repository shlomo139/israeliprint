import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import SiteBanner from './components/SiteBanner';
import PopupModal from './components/PopupModal';
import ProductCategoryPage from './pages/ProductCategoryPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import WhatsAppButton from './components/WhatsAppButton';
import { CATEGORY_DETAILS } from './constants';
import { InventoryProvider } from './src/InventoryContext';

// Admin pages — lazy loaded so they don't affect the main bundle
const AdminLoginPage    = lazy(() => import('./src/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./src/pages/admin/AdminDashboardPage'));

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <HashRouter>
        <Routes>
          {/* ─── Admin routes (standalone — no Header/Footer) ─── */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
                <AdminLoginPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0f1e' }} />}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

          {/* ─── Main shop routes ─── */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col bg-yisraeli-blue text-white w-full overflow-x-hidden">
                <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col shadow-md">
                  <SiteBanner />
                  <Header />
                </div>
                {/* שיניתי ל-pt-[155px] בנייד ו-pt-[210px] במחשב כדי לתת מקום לבאנר */}
                <main className="flex-grow container mx-auto px-4 py-8 pt-[200px] md:pt-[250px] relative z-10 w-full max-w-[100vw]">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/:categoryPath"
                      element={<ProductCategoryPage />}
                    />
                    <Route path="/contact" element={<ContactPage />} />
                  </Routes>
                </main>
                <Footer />
                <WhatsAppButton />
                <PopupModal />
              </div>
            }
          />
        </Routes>
      </HashRouter>
    </InventoryProvider>
  );
};

export default App;
