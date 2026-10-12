
import React, { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
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
    <div className="fixed bottom-4 right-4 z-[150] w-[min(36rem,calc(100%-2rem))] animate-in slide-in-from-bottom-4 duration-500">
      <div className="max-w-4xl mx-auto bg-card backdrop-blur-md border border-border rounded-2xl shadow-2xl p-6 md:flex md:items-start md:gap-8 relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent blur-[80px] rounded-full pointer-events-none"></div>

        {!showSettings ? (
            /* SIMPLE BANNER MODE */
            <>
                <div className="flex-1 mb-4 md:mb-0 relative z-10">
                    <h3 className="text-foreground font-bold text-lg mb-2 flex items-center gap-2">
                        <Cookie className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
                        We value your privacy
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        We use essential cookies and optional analytics to improve your experience. 
                        You can accept or manage your preferences at any time.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="px-5 py-2.5 text-muted-foreground font-bold text-sm bg-secondary hover:bg-accent rounded-lg transition-colors border border-border"
                    >
                        Settings
                    </button>
                    <button 
                        onClick={handleAcceptAll}
                        className="px-6 py-2.5 text-primary-foreground font-bold text-sm bg-primary hover:opacity-90 rounded-lg shadow-lg shadow-none transition-all"
                    >
                        Accept All
                    </button>
                </div>
            </>
        ) : (
            /* SETTINGS MODE */
            <div className="w-full relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
                    <div>
                        <h3 className="text-foreground font-bold text-lg">Cookie Preferences</h3>
                        <p className="text-muted-foreground text-xs mt-1">Manage which cookies you allow.</p>
                    </div>
                    <button onClick={() => setShowSettings(false)} className="text-xs text-muted-foreground hover:text-foreground underline">Back</button>
                </div>

                <div className="space-y-4 mb-8">
                    {/* Essential */}
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                        <div>
                            <span className="text-foreground font-bold text-sm block">Essential</span>
                            <span className="text-muted-foreground text-xs">Required for the app to function (Auth, Stripe).</span>
                        </div>
                        <div className="px-3 py-1 bg-secondary text-muted-foreground text-[10px] font-bold uppercase rounded border border-border cursor-not-allowed">
                            Always On
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                        <div>
                            <span className="text-foreground font-bold text-sm block">Analytics (Firebase)</span>
                            <span className="text-muted-foreground text-xs">Helps us improve features by tracking usage anonymously.</span>
                        </div>
                        <button 
                            onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                            className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${analyticsEnabled ? 'bg-primary' : 'bg-accent'}`}
                        >
                            <div className={`bg-primary-foreground w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${analyticsEnabled ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button 
                        onClick={handleAcceptAll}
                        className="px-5 py-2.5 text-muted-foreground font-bold text-sm hover:text-foreground transition-colors"
                    >
                        Accept All
                    </button>
                    <button 
                        onClick={handleSaveSettings}
                        className="px-6 py-2.5 text-primary-foreground font-medium text-sm bg-primary hover:opacity-90 rounded-lg transition-all"
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
