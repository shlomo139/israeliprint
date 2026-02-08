import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage'; // אם יש לך דף ניהול

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* ההידר (הבאנר העליון) */}
        <Header />
        
        {/* התיקון נמצא כאן בשורה למטה: 
           pt-40 = דוחף את התוכן למטה במובייל (כדי שלא יוסתר ע"י הלוגו)
           md:pt-52 = דוחף את התוכן עוד יותר למטה במחשב (כי הלוגו גדול יותר)
        */}
        <main className="flex-grow pt-40 md:pt-52">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/product/:productId" element={<ProductPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <Footer />
        
      </div>
    </Router>
  );
}

export default App;
