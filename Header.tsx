
import React from 'react';
import { NavLink } from 'react-router-dom';
import { CATEGORY_DETAILS } from '../constants';

// SVG Data URI for the Yisraeli Logo (Camera + Text + Phone)
const LOGO_SRC = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'%3E%3Cdefs%3E%3Cstyle%3E@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&display=swap'); text { font-family: 'Assistant', sans-serif; }%3C/style%3E%3C/defs%3E%3C!-- Camera Icon --%3E%3Cpath d='M100 40 h20 l10 -15 h40 l10 15 h20 a10 10 0 0 1 10 10 v60 a10 10 0 0 1 -10 10 h-100 a10 10 0 0 1 -10 -10 v-60 a10 10 0 0 1 10 -10 Z' fill='none' stroke='%23f7b500' stroke-width='2'/%3E%3Ccircle cx='150' cy='80' r='25' fill='none' stroke='%23f7b500' stroke-width='2'/%3E%3C!-- Star of David --%3E%3Cpath d='M150 68 l8 14 h-16 Z' fill='none' stroke='%230d243a' stroke-width='2'/%3E%3Cpath d='M150 92 l-8 -14 h16 Z' fill='none' stroke='%230d243a' stroke-width='2'/%3E%3C!-- Text --%3E%3Ctext x='150' y='135' font-weight='700' font-size='40' text-anchor='middle' fill='%230d243a'%3E%D7%99%D7%A9%D7%A8%D7%90%D7%9C%D7%99%3C/text%3E%3Ctext x='150' y='155' font-size='12' text-anchor='middle' fill='%230d243a'%3E%D7%9E%D7%93%D7%A4%D7%99%D7%A1%D7%99%D7%9D%20%D7%A8%D7%92%D7%A2%D7%99%D7%9D%20%D7%A9%D7%9C%20%D7%90%D7%95%D7%A9%D7%A8%3C/text%3E%3Ctext x='150' y='175' font-weight='700' font-size='14' text-anchor='middle' fill='%23f7b500'%3E052-686-4724%3C/text%3E%3C/svg%3E";

const Logo = () => (
    <div className="flex items-center">
        <img src={LOGO_SRC} alt="לוגו ישראלי" className="h-20 md:h-24" />
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
          <Logo />
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
