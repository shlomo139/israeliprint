import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Header: React.FC = () => {
  const words = ["אושר", "אהבה", "משפחה", "זכרונות", "קסם"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap text-xs md:text-sm font-bold transition-all duration-200 px-2 py-1 rounded-sm ${
      isActive
        ? 'text-black bg-white/30' 
        : 'text-gray-900 hover:text-black hover:bg-white/10'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-lg">
      
      {/* --- חלק עליון: מכווץ, מעוצב ועם רקע מעניין --- */}
      <div className="relative w-full flex flex-col items-center justify-center py-2 overflow-hidden bg-white">
        
        {/* אלמנט עיצובי: רשת נקודות ברקע לשבירת הריקנות */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#f7b500 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>
        
        {/* כתמי צבע עדינים בצדדים */}
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -right-10 top-0 w-24 h-24 bg-orange-100 rounded-full blur-3xl opacity-50"></div>

        {/* תוכן הבאנר העליון */}
        <div className="relative z-10 flex flex-col items-center gap-0">
            <NavLink to="/">
            {/* הקטנתי את הלוגו משמעותית כדי לחסוך גובה */}
            <img 
                src="/logo.png" 
                alt="לוגו ישראלי" 
                className="h-14 md:h-20 object-contain drop-shadow-sm transform hover:scale-105 transition-transform" 
            />
            </NavLink>

            {/* המשפט המתחלף - גדל ונהיה בולד מאוד */}
            <div className="text-gray-800 font-black text-lg md:text-2xl flex items-center gap-1.5 leading-none mt-1">
            <span className="tracking-tight">מדפיסים רגעים של</span>
            <span className="text-[#f7b500] min-w-[60px] text-center">
                {words[currentWordIndex]}
            </span>
            </div>
        </div>
      </div>

      {/* --- חלק תחתון: תפריט צהוב סופר-קומפקטי --- */}
      <div className="bg-[#f7b500] w-full shadow-md z-20">
        <nav className="container mx-auto">
          {/* gap-1 = רווח מינימלי בין כפתורים */}
          <div className="flex items-center justify-between md:justify-center gap-1 py-2 px-2 overflow-x-auto no-scrollbar">
            
            {Object.values(CATEGORY_DETAILS).map((cat) => (
              <NavLink key={cat.path} to={cat.path} className={navLinkClass}>
                {cat.name}
              </NavLink>
            ))}
            
            {/* הפרדה קטנה לפני צור קשר */}
            <div className="w-[1px] h-4 bg-black/10 mx-1"></div>

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
