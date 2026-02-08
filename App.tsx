
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProductCategoryPage from './pages/ProductCategoryPage';
import ContactPage from './pages/ContactPage';
import { CATEGORY_DETAILS } from './constants';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-yisraeli-blue">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 pt-28 md:pt-36">
          <Routes>
            <Route path="/" element={<Navigate to={CATEGORY_DETAILS.prints.path} replace />} />
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
            <Route 
              path="/contact"
              element={<ContactPage />}
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

export default App;
