import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';
import { Menu, X } from 'lucide-react';

// SVG Data URI for the Yisraeli Logo (Camera + Text + Phone)
const LOGO_SRC = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'%3E%3Cdefs%3E%3Cstyle%3E@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&display=swap'); text { font-family: 'Assistant', sans-serif; }%3C/style%3E%3C/defs%3E%3C!-- Camera Icon --%3E%3Cpath d='M100 40 h20 l10 -15 h40 l10 15 h20 a10 10 0 0 1 10 10 v60 a10 10 0 0 1 -10 10 h-100 a10 10 0 0 1 -10 -10 v-60 a10 10 0 0 1 10 -10 Z' fill='none' stroke='%23f7b500' stroke-width='2'/%3E%3Ccircle cx='150' cy='80' r='25' fill='none' stroke='%23f7b500' stroke-width='2'/%3E%3C!-- Star of David --%3E%3Cpath d='M150 68 l8 14 h-16 Z' fill='none' stroke='%230d243a' stroke-width='2'/%3E%3Cpath d='M150 92 l-8 -14 h16 Z' fill='none' stroke='%230d243a' stroke-width='2'/%3E%3C!-- Text --%3E%3Ctext x='150' y='135' font-weight='700' font-size='40' text-anchor='middle' fill='%230d243a'%3E%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99%3C/text%3E%3Ctext x='150' y='155' font-size='12' text-anchor='middle' fill='%230d243a'%3E%D7%9E%D7%93%D7%A4%D7%99%D7%A1%D7%99%D7%9D%20%D7%A8%D7%92%D7%A2%D7%99%D7%9D%20%D7%A9%D7%9C%20%D7%90%D7%95%D7%A9%D7%A8%3C/text%3E%3Ctext x='150' y='175' font-weight='700' font-size='14' text-anchor='middle' fill='%23f7b500'%3E052-686-4724%3C/text%3E%3C/svg%3E";

const Logo = () => (
    <div className="flex items-center">
        <img src={LOGO_SRC} alt="לוגו ישראלי" className="h-20 md:h-24" />
    </div>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `block py-3 px-4 text-lg font-semibold transition-colors duration-300 rounded-lg ${
      isActive
        ? 'bg-yisraeli-blue text-yisraeli-yellow shadow-md'
        : 'text-yisraeli-blue hover:bg-blue-50'
    }`;

  // When Menu is open on RTL, translate-x is positive to hide it to the right
  // We use standard tailwind LTR/RTL support here safely or absolute manual.
  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 md:h-28">
            <Link to="/" onClick={closeMenu} className="focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow rounded-lg">
              <Logo />
            </Link>
            
            <button 
              onClick={toggleMenu}
              className="p-3 bg-blue-50 rounded-full text-yisraeli-blue hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow"
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeMenu}
      />
      
      {/* Side Menu Drawer */}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
           <span className="font-bold text-yisraeli-blue text-xl">תפריט חנות</span>
           <button onClick={closeMenu} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-6 h-6" />
           </button>
        </div>
        
        <nav className="flex flex-col gap-2 p-6 flex-grow overflow-y-auto">
          <NavLink to="/" className={navLinkClass} onClick={closeMenu}>
            דף הבית
          </NavLink>
          
          <div className="h-px bg-gray-100 my-3" />
          
          <span className="text-gray-400 font-semibold px-4 pb-2 text-sm">המוצרים שלנו</span>
          {Object.values(CATEGORY_DETAILS).map(cat => (
            <NavLink key={cat.path} to={cat.path} className={navLinkClass} onClick={closeMenu}>
              {cat.name}
            </NavLink>
          ))}
          
          <div className="h-px bg-gray-100 my-3" />
          
          <NavLink to="/contact" className={navLinkClass} onClick={closeMenu}>
            צרו קשר
          </NavLink>
        </nav>
      </div>
    </>
  );
};

export default Header;
