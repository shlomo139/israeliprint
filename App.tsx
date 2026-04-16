import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCategoryPage from './pages/ProductCategoryPage';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import WhatsAppButton from './components/WhatsAppButton';
import { CATEGORY_DETAILS } from './constants';

// Admin pages — lazy loaded so they don't affect the main bundle
const AdminLoginPage    = lazy(() => import('./src/pages/admin/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./src/pages/admin/AdminDashboardPage'));

const App: React.FC = () => {
  return (
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
            <div className="min-h-screen flex flex-col bg-yisraeli-blue">
              <Header />
              {/* שיניתי ל-pt-[155px] בנייד ו-pt-[210px] במחשב כדי לתת מקום לבאנר */}
              <main className="flex-grow container mx-auto px-4 py-8 pt-[155px] md:pt-[210px]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path={CATEGORY_DETAILS.prints.path}
                    element={<ProductCategoryPage categoryKey="prints" />}
                  />
                  <Route
                    path={CATEGORY_DETAILS.blocks.path}
                    element={<ProductCategoryPage categoryKey="blocks" />}
                  />
                  <Route
                    path={CATEGORY_DETAILS.magnets.path}
                    element={<ProductCategoryPage categoryKey="magnets" />}
                  />
                  <Route
                    path={CATEGORY_DETAILS.kits.path}
                    element={<ProductCategoryPage categoryKey="kits" />}
                  />
                  <Route path="/contact" element={<ContactPage />} />
                </Routes>
              </main>
              <Footer />
              <WhatsAppButton />
            </div>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
