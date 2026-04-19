import React, { useState, useEffect } from 'react';
import { useInventory } from '../src/InventoryContext';
import { X } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

const PopupModal: React.FC = () => {
    const { settings } = useInventory();
    const [isOpen, setIsOpen] = useState(false);
    const { width, height } = useWindowSize();

    useEffect(() => {
        // Show only if image_only is enabled AND image url exists.
        // Also use sessionStorage to prevent showing it on every single reload in the same session.
        if (settings?.banner_mode === 'image_only' && settings?.banner_image_url) {
            const isTest = window.location.search.includes('test_popup=1');
            const hasSeen = sessionStorage.getItem('popup_seen');
            if (!hasSeen || isTest) {
                // small delay to let page load
                const timer = setTimeout(() => {
                    setIsOpen(true);
                    if (!isTest) sessionStorage.setItem('popup_seen', 'true');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [settings]);

    if (!isOpen || !settings?.banner_image_url) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
            <Confetti width={width} height={height} numberOfPieces={200} recycle={false} style={{ zIndex: 201 }} />
            
            <div className="relative bg-transparent rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col items-center justify-center animate-in zoom-in-90 fade-in duration-500 z-[202]">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="absolute -top-12 right-0 md:-right-12 p-3 bg-white/10 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md border border-white/20 shadow-lg"
                >
                    <X className="w-6 h-6" />
                </button>
                <img 
                  src={settings.banner_image_url} 
                  alt="מבצע מיוחד!" 
                  className="w-full h-auto rounded-[2rem] shadow-[0_0_40px_rgba(59,130,246,0.3)] border-4 border-white/10 object-contain max-h-[85vh]" 
                />
            </div>
        </div>
    );
};

export default PopupModal;
