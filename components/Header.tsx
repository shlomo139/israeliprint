import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap text-xs md:text-sm font-bold transition-all duration-200 px-3 py-1 rounded-sm ${
      isActive
        ? 'text-black bg-white/30' 
        : 'text-gray-900 hover:text-black hover:bg-white/10'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-lg bg-white">
      
      {/* --- חלק עליון: הבאנר המעוצב --- */}
      <NavLink to="/" className="w-full block overflow-hidden">
        
        {/* תמונה למחשב (מוסתרת בנייד) */}
        <img 
          src="/banner-pc.jpg" 
          alt="באנר ראשי" 
          className="hidden md:block w-full h-auto object-cover max-h-[140px]" 
          // max-h-[140px] שומר שהבאנר לא יהיה ענק מדי במסכים רחבים
        />

        {/* תמונה לנייד (מוסתרת במחשב) */}
        <img 
          src="/banner-mobile.jpg" 
          alt="באנר ראשי" 
          className="block md:hidden w-full h-auto object-cover max-h-[100px]" 
        />
      </NavLink>


      {/* --- חלק תחתון: תפריט צהוב --- */}
      <div className="bg-[#f7b500] w-full shadow-md z-20">
        <nav className="container mx-auto">
          <div className="flex items-center justify-between md:justify-center gap-2 py-2 px-3 overflow-x-auto no-scrollbar">
            
            {Object.values(CATEGORY_DETAILS).map((cat) => (
              <NavLink key={cat.path} to={cat.path} className={navLinkClass}>
                {cat.name}
              </NavLink>
            ))}
            
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
