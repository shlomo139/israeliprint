
import React from 'react';
import { Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { WHATSAPP_NUMBER } from '../constants';

const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4 drop-shadow-md">
          צרו איתנו קשר
        </h1>
        <p className="text-xl text-blue-100">
          אנחנו כאן לכל שאלה, בקשה או התייעצות
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:scale-[1.02] transition-transform">
          <h2 className="text-2xl font-bold text-yisraeli-blue mb-6 border-b pb-2">פרטי התקשרות</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <Phone className="w-6 h-6 text-yisraeli-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">טלפון</p>
                <a href="tel:0526864724" className="text-lg font-bold text-gray-800 hover:text-yisraeli-yellow transition-colors">
                  052-686-4724
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-yisraeli-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">כתובת</p>
                <p className="text-lg font-bold text-gray-800">
                  אלון מורה
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full">
                <Clock className="w-6 h-6 text-yisraeli-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-semibold">שעות פעילות</p>
                <p className="text-lg font-bold text-gray-800">
                  ימים א'-ה': 08:00 - 22:00
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-yisraeli-yellow rounded-2xl shadow-xl p-8 flex flex-col justify-between transform hover:scale-[1.02] transition-transform">
          <div>
            <h2 className="text-2xl font-bold text-yisraeli-blue mb-4">זמינים בוואטסאפ!</h2>
            <p className="text-yisraeli-blue/80 text-lg mb-8">
              הדרך הכי מהירה ונוחה להזמין או לשאול שאלות. שלחו לנו הודעה ונחזור אליכם בהקדם.
            </p>
          </div>
          
          <a 
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-green-600 font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all active:scale-95"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xl">שלחו הודעה עכשיו</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
