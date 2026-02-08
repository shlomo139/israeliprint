import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Logo = () => (
  <div className="flex items-center">
    {/* כאן התיקון: הפנייה ישירה לקובץ בתיקיית פאבליק */}
    <img 
      src="/logo.png" 
      alt="לוגו ישראלי" 
      className="h-20 md:h-24 object-contain" 
    />
  </div>
);

const Header: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `pb-2 text-sm md:text-base font-semibold transition-colors duration-300 ${
      isActive
        ? 'text-gray-900 border-b-2 border-yisraeli-yellow'
        : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24 md:h-28">
          
          {/* לוגו צד ימין */}
          <NavLink to="/">
             <Logo />
          </NavLink>

          {/* תפריט ניווט */}
          <nav className="flex items-center gap-4 md:gap-8 overflow-x-auto pl-2 no-scrollbar">
            {Object.values(CATEGORY_DETAILS).map(cat => (
              <NavLink key={cat.path} to={cat.path} className={navLinkClass}>
                {cat.name}
              </NavLink>
            ))}
            <NavLink to="/contact" className={navLinkClass}>
              צרו קשר
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
