import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants'; // וודא שהנתיב הזה נכון אצלך

const Header: React.FC = () => {
  // עיצוב הקישורים בתפריט
  const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
    `whitespace-nowrap pb-2 text-sm md:text-base font-semibold transition-colors duration-300 px-2 ${
      isActive
        ? 'text-gray-900 border-b-2 border-yellow-500' // צבע צהוב לפס הדגשה
        : 'text-gray-500 hover:text-gray-900'
    }`;

  return (
    // הורדנו את הגובה הקבוע כדי שההידר יגדל לפי התוכן
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 pb-2">
      <div className="container mx-auto px-4">
        
        {/* שינוי מרכזי: flex-col מסדר את הדברים אחד מתחת לשני */}
        <div className="flex flex-col items-center justify-center pt-4">
          
          {/* חלק עליון: לוגו במרכז */}
          <div className="mb-4">
            <NavLink to="/">
              {/* הלוגו עצמו - וודא שקובץ logo.png קיים בתיקיית public */}
              <img 
                src="/logo.png" 
                alt="לוגו ישראלי" 
                className="h-20 md:h-24 object-contain mx-auto" 
              />
            </NavLink>
          </div>

          {/* חלק תחתון: תפריט גלילה */}
          <nav className="w-full flex items-center justify-start md:justify-center gap-6 overflow-x-auto no-scrollbar pb-2">
            
            {/* כפתור הבית (אופציונלי, אם תרצה אותו גם בתפריט) */}
             <NavLink to="/" className={navLinkClass}>
                ראשי
             </NavLink>

            {/* שאר הקטגוריות */}
            {Object.values(CATEGORY_DETAILS).map((cat) => (
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
