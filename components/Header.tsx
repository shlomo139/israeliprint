import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

const Header: React.FC = () => {
  // עיצוב הקישורים - הורדתי את הקו התחתון והוספתי הדגשה עדינה יותר
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap text-sm md:text-base font-bold transition-colors duration-200 ${
      isActive
        ? 'text-black underline decoration-2 underline-offset-4' // הדגשה כשהקישור פעיל
        : 'text-gray-800 hover:text-black' // צבע רגיל
    }`;

  return (
    // ההידר צמוד למעלה ומחולק לשתי קומות
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col shadow-md">
      
      {/* קומה 1 (עליונה): רקע לבן + לוגו גדול */}
      <div className="bg-white w-full flex justify-center py-1">
        <NavLink to="/">
          <img 
            src="/logo.png" 
            alt="לוגו ישראלי" 
            // הגדלתי את הגובה ל-h-28 (בנייד) ו-h-36 (במחשב)
            className="h-28 md:h-36 object-contain" 
          />
        </NavLink>
      </div>

      {/* קומה 2 (תחתונה): פס צהוב + תפריט צפוף */}
      <div className="bg-[#f7b500] w-full overflow-x-auto no-scrollbar">
        <nav className="container mx-auto px-2">
          {/* צמצמתי את ה-gap ל-3 כדי שייכנסו יותר פריטים */}
          <div className="flex items-center justify-start md:justify-center gap-4 py-2 min-w-max px-2">
            
            {/* כאן רצות הקטגוריות (בלי "ראשי") */}
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
