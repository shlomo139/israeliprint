import React, { useState, useEffect } from 'react';
import { useInventory } from '../src/InventoryContext';
import { X } from 'lucide-react';

const SiteBanner: React.FC = () => {
    const { settings } = useInventory();
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible || !settings || settings.banner_mode !== 'text' || !settings.banner_title) return null;

    return (
        <div className={`relative px-4 py-2 ${settings.banner_bg_color || 'bg-yisraeli-blue'} text-white shadow-xl isolate z-[60]`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="container mx-auto flex items-center justify-center relative z-10">
                <div className="text-center flex-grow pr-8">
                    <p className="text-sm md:text-base font-black truncate">{settings.banner_title}</p>
                    {settings.banner_subtitle && <p className="text-xs md:text-sm text-white/80 font-semibold truncate">{settings.banner_subtitle}</p>}
                </div>
                <button 
                  onClick={() => setIsVisible(false)} 
                  className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0 absolute left-0"
                  aria-label="סגור באנר"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SiteBanner;
