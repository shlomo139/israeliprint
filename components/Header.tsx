import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useInventory } from '../src/InventoryContext';
import { Menu, X, Home } from 'lucide-react';

const Logo = () => (
    <div className="h-full flex items-center justify-center p-1">
        <img src="/logo.png" alt="לוגו ישראלי" className="h-full w-full object-contain drop-shadow-sm scale-125 md:scale-[1.35]" />
    </div>
);

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { categories } = useInventory();

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
      <header className="w-full flex flex-col shadow-md">
        {/* White Bar */}
        <div className="bg-white/95 backdrop-blur-md">
          <div className="container mx-auto px-4 relative">
            <div className="relative flex items-center justify-center h-28 md:h-36 w-full overflow-hidden">
              
              {/* Home on the Left */}
              <Link 
                to="/"
                onClick={closeMenu}
                title="חזרה לדף הבית"
                className="absolute left-2 z-10 p-3 bg-blue-50 rounded-full text-yisraeli-blue hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow shadow-sm"
              >
                <Home className="w-7 h-7" />
              </Link>
              
              {/* Centered Large Logo */}
              <Link to="/" onClick={closeMenu} className="block h-full w-3/4 max-w-sm mx-auto focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow overflow-visible flex justify-center items-center">
                <Logo />
              </Link>
              
              {/* Hamburger on the Right */}
              <button 
                onClick={toggleMenu}
                className="absolute right-2 z-10 p-3 bg-blue-50 rounded-full text-yisraeli-blue hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-yisraeli-yellow shadow-sm"
              >
                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>
            </div>
          </div>
        </div>
        {/* Thick Yellow Bar */}
        <div className="h-4 w-full bg-yisraeli-yellow"></div>
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
          {categories.map(cat => (
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
