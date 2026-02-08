import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    // שינויים שעשיתי כאן לחיסכון במקום:
    // 1. text-xs = גודל 12px (קריא וטוב)
    // 2. px-1.5 = פחות ריפוד בצדדים של המילים
    `whitespace-nowrap text-xs md:text-sm font-bold transition-all duration-200 px-1.5 py-1 rounded-sm ${
      isActive
        ? 'text-black bg-white/30' 
        : 'text-gray-900 hover:text-black hover:bg-white/10'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-lg bg-white">
      
      {/* --- חלק עליון: הבאנר המעוצב --- */}
      <NavLink to="/" className="w-full block overflow-hidden bg-white">
        {/* תמונה למחשב */}
        <img 
          src="/banner-pc.jpg" 
          alt="באנר ראשי" 
          className="hidden md:block w-full h-auto object-cover max-h-[140px]" 
        />
        {/* תמונה לנייד */}
        <img 
          src="/banner-mobile.jpg" 
          alt="באנר ראשי" 
          className="block md:hidden w-full h-auto object-cover max-h-[100px]" 
        />
      </NavLink>

      {/* --- חלק תחתון: תפריט צהוב --- */}
      <div className="bg-[#f7b500] w-full shadow-md z-20">
        {/* הורדתי את ה-container כדי לנצל 100% רוחב מסך בנייד */}
        <nav className="w-full md:container md:mx-auto">
          
          {/* שינויים קריטיים כאן:
              1. gap-0.5 = רווח מינימלי בין פריטים (2 פיקסלים)
              2. px-1 = כמעט בלי שוליים בצדדים
              3. justify-between = מנסה לפרוס אותם יפה לרוחב
          */}
          <div className="flex items-center justify-between md:justify-center gap-0.5 py-2 px-1 overflow-x-auto no-scrollbar">
            
            {Object.values(CATEGORY_DETAILS).map((cat) => (
              <NavLink key={cat.path} to={cat.path} className={navLinkClass}>
                {cat.name}
              </NavLink>
            ))}
            
            {/* קו הפרדה דקיק */}
            <div className="w-[1px] h-3 bg-black/20 mx-0.5 shrink-0"></div>

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
