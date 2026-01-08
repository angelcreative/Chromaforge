
import React, { useState, useEffect } from 'react';
import { setAnalyticsConsent } from '../firebaseConfig';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Settings state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true); // Default check in UI before saving

  useEffect(() => {
    const storedConsent = localStorage.getItem('chroma_cookie_consent');
    if (!storedConsent) {
      setIsVisible(true);
    } else {
      // Re-apply settings on reload based on stored value
      const consentData = JSON.parse(storedConsent);
      setAnalyticsConsent(consentData.analytics);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = { essential: true, analytics: true };
    localStorage.setItem('chroma_cookie_consent', JSON.stringify(consentData));
    setAnalyticsConsent(true);
    setIsVisible(false);
  };

  const handleSaveSettings = () => {
    const consentData = { essential: true, analytics: analyticsEnabled };
    localStorage.setItem('chroma_cookie_consent', JSON.stringify(consentData));
    setAnalyticsConsent(analyticsEnabled);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[150] p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6 md:flex md:items-start md:gap-8 relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>

        {!showSettings ? (
            /* SIMPLE BANNER MODE */
            <>
                <div className="flex-1 mb-4 md:mb-0 relative z-10">
                    <h3 className="text-white font-bold text-lg mb-2">We value your privacy 🍪</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        We use essential cookies and optional analytics to improve your experience. 
                        You can accept or manage your preferences at any time.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="px-5 py-2.5 text-slate-300 font-bold text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                    >
                        Settings
                    </button>
                    <button 
                        onClick={handleAcceptAll}
                        className="px-6 py-2.5 text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        Accept All
                    </button>
                </div>
            </>
        ) : (
            /* SETTINGS MODE */
            <div className="w-full relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div>
                        <h3 className="text-white font-bold text-lg">Cookie Preferences</h3>
                        <p className="text-slate-400 text-xs mt-1">Manage which cookies you allow.</p>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="text-xs text-slate-500 hover:text-white underline">Back</button>
                </div>

                <div className="space-y-4 mb-8">
                    {/* Essential */}
                    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-white/5">
                        <div>
                            <span className="text-white font-bold text-sm block">Essential</span>
                            <span className="text-slate-500 text-xs">Required for the app to function (Auth, Stripe).</span>
                        </div>
                        <div className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-700 cursor-not-allowed">
                            Always On
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-white/5">
                        <div>
                            <span className="text-white font-bold text-sm block">Analytics (Firebase)</span>
                            <span className="text-slate-500 text-xs">Helps us improve features by tracking usage anonymously.</span>
                        </div>
                        <button 
                            onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                            className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${analyticsEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                        >
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${analyticsEnabled ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={handleAcceptAll}
                        className="px-5 py-2.5 text-slate-300 font-bold text-sm hover:text-white transition-colors"
                    >
                        Accept All
                    </button>
                    <button 
                        onClick={handleSaveSettings}
                        className="px-6 py-2.5 text-slate-900 font-bold text-sm bg-white hover:bg-slate-200 rounded-lg shadow-lg transition-all"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CookieConsent;
