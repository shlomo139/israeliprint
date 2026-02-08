
import React from 'react';
import { Phone, MapPin, Clock } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

const Footer: React.FC = () => {
  return (
    <footer className="bg-yisraeli-blue text-white py-8 mt-auto border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-right space-y-2">
            <h3 className="text-xl font-bold text-yisraeli-yellow mb-2">צרו איתנו קשר</h3>
            
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Phone className="w-4 h-4 text-yisraeli-yellow" />
              <a href={`tel:${WHATSAPP_NUMBER}`} className="hover:text-yisraeli-yellow transition-colors">
                052-6864724
              </a>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-yisraeli-yellow" />
              <span>אלון מורה</span>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Clock className="w-4 h-4 text-yisraeli-yellow" />
              <span>א-ה 8:00-22:00</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} ישראלי - מדפיסים רגעים של אושר
            </p>
          </div>
          
        </div>
      </div>
    </footer>
  );
};

export default Footer;
