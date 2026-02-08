import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Header: React.FC = () => {
  // --- לוגיקה למילים המתחלפות ---
  const words = ["אושר", "אהבה", "משפחה", "זכרונות", "קסם"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2500); // מחליף מילה כל 2.5 שניות
    return () => clearInterval(interval);
  }, []);
  // -----------------------------

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap text-sm md:text-base font-bold transition-all duration-200 px-3 py-1 rounded-md ${
      isActive
        ? 'text-black bg-white/20 shadow-sm' // הדגשה כשהקישור פעיל
        : 'text-gray-900 hover:text-black hover:bg-white/10' // צבע רגיל
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-lg">
      
      {/* --- חלק עליון: לוגו + אנימציית טקסט --- */}
      {/* הוספתי רקע עדין מאוד (גרדיאנט) כדי לשבור את הלבן הבוהק */}
      <div className="bg-gradient-to-b from-white to-gray-50 w-full flex flex-col items-center justify-center py-4 relative overflow-hidden">
        
        {/* קישוטים עדינים ברקע (עיגולים צהובים מטושטשים בצדדים) - אופציונלי */}
        <div className="absolute top-0 left-10 w-24 h-24 bg-yellow-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-10 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-30"></div>

        <NavLink to="/" className="z-10 transform hover:scale-105 transition-transform duration-500">
          <img 
            src="/logo.png" 
            alt="לוגו ישראלי" 
            className="h-28 md:h-32 object-contain drop-shadow-sm" 
          />
        </NavLink>

        {/* --- המשפט המתחלף --- */}
        <div className="mt-2 text-gray-600 font-medium text-lg flex items-center gap-1 z-10">
          <span>מדפיסים רגעים של</span>
          <span className="text-[#f7b500] font-bold min-w-[80px] transition-all duration-500 transform translate-y-0">
            {words[currentWordIndex]}
          </span>
        </div>
      </div>

      {/* --- חלק תחתון: תפריט צהוב --- */}
      <div className="bg-[#f7b500] w-full shadow-inner">
        <nav className="container mx-auto">
          {/* הוספתי overflow-x-auto כדי לאפשר גלילה חלקה בנייד */}
          <div className="flex items-center justify-start md:justify-center gap-2 py-3 px-4 overflow-x-auto no-scrollbar">
            
            {Object.values(CATEGORY_DETAILS).map((cat) => (
              <NavLink key={cat.path} to={cat.path} className={navLinkClass}>
                {cat.name}
              </NavLink>
            ))}
            
            <NavLink to="/contact" className={navLinkClass}>
              צרו קשר
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
