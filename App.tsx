
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ColorHSL, ColorData, HarmonyType, ChatMessage, ScaleConfiguration, InputMode, PaletteTab, PlaygroundConfig, GlobalCurveConfig } from './types';
import { generateHarmonies, createColorDataFromHSL, hexToHsl, deduplicateColorNames, generateNeutrals, generateSemantics, createColorData, hslToRgb, rgbToHex } from './utils/colorUtils';
import ColorWheel from './components/ColorWheel';
import { generatePaletteFromPrompt } from './services/geminiService';
import ContrastGrid from './components/ContrastGrid';
import ColorInfo from './components/ColorInfo';
import PaletteCard from './components/PaletteCard';
import PaletteCard3D from './components/PaletteCard3D';
import VoxelVisualization from './components/VoxelVisualization';
import ExportModal from './components/ExportModal';
import PaletteTunerModal from './components/PaletteTunerModal';
import ScaleEditorModal from './components/ScaleEditorModal';
import ColorRowInput from './components/ColorRowInput';
import ImportModal from './components/ImportModal';
import Palette3DModal from './components/Palette3DModal';
import UIPlayground from './components/UIPlayground';
import GradientList from './components/GradientList';
import { ntc } from './utils/ntc';
import { HiCheck, HiX, HiPencil, HiAdjustments, HiBookOpen, HiHeart, HiArrowRight, HiChevronRight, HiPlus, HiUpload, HiArrowUp, HiViewGrid, HiCube, HiCollection, HiMenu, HiSparkles } from 'react-icons/hi';
import { FaPalette, FaCubes, FaPaperPlane, FaEyeDropper } from 'react-icons/fa';
// Auth & Storage Imports
import { User } from 'firebase/auth'; 
import { subscribeToAuth, ensureBillingUser } from './services/authService';
import { isDemoMode } from './firebaseConfig';
import { savePaletteToFirestore, getUserPalettes, deletePaletteFromFirestore, SavedPalette } from './services/storageService';
import { captureOwnerAccessFromUrl, clearOwnerAccess, confirmOwnerAccess, hasOwnerFlag, markOwnerUnlocked } from './services/ownerAccess';
import { buildStudioColorSkill } from './utils/colorSkill';
import ThemeToggle from './components/ThemeToggle';

// Subscription Imports
import { checkSubscriptionStatus, createCheckoutSession } from './services/subscriptionService';
import PricingModal from './components/PricingModal';
import ConfirmModal from './components/ConfirmModal';

import PaletteLibraryModal from './components/PaletteLibraryModal';

// Legal & Cookies
import CookieConsent from './components/CookieConsent';
import LegalModal, { LegalPageType } from './components/LegalModal';

// --- Toast Component ---
const Toast: React.FC<{ message: string; isVisible: boolean }> = ({ message, isVisible }) => {
  if (!isVisible) return null;
  return (
    <div className="fixed bottom-24 md:bottom-6 left-1/2 transform -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
      <div className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
         <div className="bg-green-500/20 p-1.5 rounded-full">
            <HiCheck className="w-4 h-4 text-green-400" />
         </div>
         <span className="font-medium text-sm">{message}</span>
      </div>
    </div>
  );
};

type MobileTab = 'canvas' | 'editor';
type ViewMode = 'grid' | 'card3d' | 'voxel' | 'playground' | 'gradients';
type CreationMode = 'generator' | 'manual';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Subscription. The studio itself does not wait on this.
  const [isPremium, setIsPremium] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  // App State
  const [creationMode, setCreationMode] = useState<CreationMode>('generator');
  const [baseColor, setBaseColor] = useState<ColorHSL>({ h: 215, s: 25, l: 47 });
  const [brightness, setBrightness] = useState(47);
  const [harmony, setHarmony] = useState<HarmonyType>('monochromatic');
  const [inputMode, setInputMode] = useState<InputMode>('wheel');
  
  // NEW: Global Curve Controls
  const [globalCurveConfig, setGlobalCurveConfig] = useState<GlobalCurveConfig>({
      vibrancy: 0,
      contrast: 0,
      hueTorsion: 0,
      steps: 11 // Default steps
  });
  
  // NEW: Collapsible state for Curve Controls (Default closed as requested)
  const [isCurveControlsOpen, setIsCurveControlsOpen] = useState(false);
  
  // NEW: View Toggle
  const [isCompactView, setIsCompactView] = useState(false);

  // NEW: Sidebar Expand/Collapse
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Palettes
  const [palette, setPalette] = useState<ColorData[]>([]);
  const [customColors, setCustomColors] = useState<ColorData[]>([]); // For Manual Mode
  
  const [neutralPalette, setNeutralPalette] = useState<ColorData[]>([]);
  const [semanticPalette, setSemanticPalette] = useState<ColorData[]>([]);
  const [paletteName, setPaletteName] = useState('Design Tokens');
  
  // UI State
  const [activeTab, setActiveTab] = useState<PaletteTab>('brand');
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor'); // Default to editor on mobile
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false); 
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [selectedColorForInfo, setSelectedColorForInfo] = useState<ColorData | null>(null);
  const [selectedColorForGrid, setSelectedColorForGrid] = useState<ColorData | null>(null);
  const [selectedColorForEdit, setSelectedColorForEdit] = useState<ColorData | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [is3DOpen, setIs3DOpen] = useState(false);
  const [localHexInput, setLocalHexInput] = useState('');
  
  // Playground Config State
  const [playgroundConfig, setPlaygroundConfig] = useState<PlaygroundConfig>({
      primaryIndex: 0,
      surfaceMode: 'neutral',
      textMode: 'base',
      disabledMode: 'base',
      isDarkMode: false
  });
  
  // Storage State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); 
  const [paletteToDelete, setPaletteToDelete] = useState<string | null>(null);

  // Legal Modal State
  const [legalModalType, setLegalModalType] = useState<LegalPageType | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const canUseAssistant = isOwner || isPremium;

  // Initialize Custom Colors with default
  useEffect(() => {
     if (customColors.length === 0) {
         setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
     }
  }, []);

  useEffect(() => {
    getUserPalettes('local').then(setSavedPalettes);
  }, []);

  // Owner code in ?access= is checked on the server, then kept for later visits.
  useEffect(() => {
    let cancelled = false;
    const code = captureOwnerAccessFromUrl();
    if (hasOwnerFlag() && code) setIsOwner(true);
    if (!code) return;
    confirmOwnerAccess(code).then((result) => {
      if (cancelled) return;
      if (result === 'yes') {
        markOwnerUnlocked();
        setIsOwner(true);
      } else if (result === 'no') {
        clearOwnerAccess();
        setIsOwner(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Subscription status only. It never gates the canvas.
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            const status = await checkSubscriptionStatus(currentUser.uid);
            setIsPremium(status);
        } else {
            setIsPremium(false);
        }
    });
    return () => unsubscribe();
  }, []);

  // --- CORE PALETTE CALCULATION LOGIC ---
  useEffect(() => {
    // GENERATOR MODE
    if (creationMode === 'generator') {
        const currentHSL = { ...baseColor, l: brightness };
        if (harmony !== 'custom') {
            const colors = generateHarmonies(currentHSL, harmony);
            setPalette(deduplicateColorNames(colors));
        } else if (palette.length === 0) {
            const single = createColorDataFromHSL(currentHSL.h, currentHSL.s, currentHSL.l);
            setPalette([single]);
        }
        // Update System Colors based on Wheel
        setNeutralPalette(generateNeutrals(currentHSL));
        setSemanticPalette(generateSemantics(currentHSL));
    } 
    // MANUAL MODE
    else {
        setPalette(customColors);
        // Update System Colors based on FIRST Custom Color (Primary)
        if (customColors.length > 0) {
            setNeutralPalette(generateNeutrals(customColors[0].hsl));
            setSemanticPalette(generateSemantics(customColors[0].hsl));
        }
    }

    // Reset saved state when parameters change
    setIsSaved(false);
  }, [baseColor, brightness, harmony, creationMode, customColors]);

  // Reset saved state when name changes
  useEffect(() => {
     setIsSaved(false);
  }, [paletteName]);

  // Sync Hex Input for Generator Mode
  useEffect(() => { 
      if (creationMode === 'generator' && palette[0] && palette[0].hex !== localHexInput) {
          setLocalHexInput(palette[0].hex);
      }
  }, [palette[0]?.hex, creationMode]);

  useEffect(() => { if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isChatOpen, isChatLoading]);
  
  // Mouse Effect
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      document.querySelectorAll('.glow-card').forEach(card => {
        const rect = (card as HTMLElement).getBoundingClientRect();
        (card as HTMLElement).style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  const showToast = (msg: string) => { setToastMessage(msg); setIsToastVisible(true); setTimeout(() => setIsToastVisible(false), 2500); };

  const handleGlobalReset = () => {
    setBaseColor({ h: 215, s: 25, l: 47 }); setBrightness(47); setHarmony('monochromatic'); setPaletteName('Design Tokens');
    setMessages([]); setChatInput(''); setIsPrintMode(false); setActiveTab('brand');
    setViewMode('grid');
    setCreationMode('generator');
    setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    setGlobalCurveConfig({ vibrancy: 0, contrast: 0, hueTorsion: 0, steps: 11 }); // Reset global controls
    setIsSaved(false);
    showToast("Workspace reset successfully");
  };

  const handleWheelChange = (hsl: ColorHSL) => { setBaseColor(hsl); if (harmony === 'custom') setHarmony('monochromatic'); };
  
  const handleManualHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setLocalHexInput(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      const hsl = hexToHsl(val); setBaseColor(hsl); setBrightness(hsl.l);
      if (harmony === 'custom') setHarmony('monochromatic');
    }
  };

  // --- MANUAL MODE HANDLERS ---
  const handleAddCustomColor = () => {
      // Add a complementary or random color logic
      // Create a variation of the last color
      const last = customColors[customColors.length - 1];
      const newH = (last.hsl.h + 30) % 360;
      
      // Calculate real name for new color
      const rgb = hslToRgb(newH, last.hsl.s, last.hsl.l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      const name = ntc.name(hex).name;

      const newColor = createColorData(hex, undefined, name);
      setCustomColors([...customColors, newColor]);
  };

  const handleUpdateCustomColor = (index: number, newColor: ColorData) => {
      const updated = [...customColors];
      updated[index] = newColor;
      setCustomColors(updated);
  };

  const handleDeleteCustomColor = (index: number) => {
      if (customColors.length <= 1) return; // Prevent deleting last color
      const updated = customColors.filter((_, i) => i !== index);
      setCustomColors(updated);
  };

  const handleImport = (colors: ColorData[]) => {
      setCustomColors(colors);
      setCreationMode('manual');
      setIsImportOpen(false);
      showToast(`Imported ${colors.length} colors`);
  };

  const handleEyeDropper = async () => {
      if (!window.EyeDropper) { showToast("EyeDropper API not supported."); return; }
      try {
          const eyeDropper = new window.EyeDropper(); const result = await eyeDropper.open();
          
          if (creationMode === 'generator') {
             const hsl = hexToHsl(result.sRGBHex); setBaseColor(hsl); setBrightness(hsl.l);
             if (harmony === 'custom') setHarmony('monochromatic');
          } else {
             // Manual Mode: Update first color or add new? Update first is safer interaction context.
             const newColor = createColorData(result.sRGBHex);
             handleUpdateCustomColor(0, newColor);
          }
      } catch (e) { console.log("EyeDropper cancelled"); }
  };

  const handleApplyPalette = (colors: ColorData[]) => {
      const uniqueColors = deduplicateColorNames(colors);
      if (uniqueColors.length > 0) {
          setCreationMode('manual');
          setCustomColors(uniqueColors);
      }
      setActiveTab('brand'); showToast("Palette applied");
      setIsSaved(false);
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); 
    if (!chatInput.trim() || isChatLoading) return;

    if (!canUseAssistant) {
        setIsPricingOpen(true);
        return;
    }

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]); setChatInput(''); setIsChatLoading(true); setIsChatOpen(true);
    
    // Determine context based on mode
    const contextPalette = creationMode === 'manual' ? customColors : palette;
    let idToken: string | null = null;
    try {
      idToken = user ? await user.getIdToken() : null;
    } catch {
      idToken = null;
    }

    const result = await generatePaletteFromPrompt(
      [...messages, userMsg],
      contextPalette.map(c => ({ name: c.name, hex: c.hex })),
      idToken
    );
    setIsChatLoading(false);

    if (result.paymentRequired) {
      if (isOwner) {
        clearOwnerAccess();
        setIsOwner(false);
      }
      setIsPricingOpen(true);
      setMessages(prev => [...prev, { role: 'model', text: result.description || 'Subscribe to use the assistant.' }]);
      return;
    }

    if (result.colors.length > 0) {
      const uniqueColors = deduplicateColorNames(result.colors); 
      handleApplyPalette(uniqueColors); 
      setPaletteName(result.name);
      setMessages(prev => [...prev, { role: 'model', text: result.description || `Updated palette: "${result.name}"`, palettePreview: uniqueColors }]);
    } else {
       setMessages(prev => [...prev, { role: 'model', text: `${result.description || "No colors came back."} This reply was not billed.` }]);
    }
  };

  const handleExportClick = () => {
      setIsExportOpen(true);
  };

  const handleTunerClick = () => {
      setIsTunerOpen(true);
  };

  // Pre-calculate Tuner Input from Current Palette
  const getTunerCode = () => {
        const data: any = {};
        // Add Brand
        if (palette.length > 0) {
            data['Brand'] = {};
            palette.forEach(c => data['Brand'][c.name] = c.hex);
        }
        // Add Neutrals (only if meaningful)
        if (neutralPalette.length > 0) {
            data['Neutrals'] = {};
            neutralPalette.forEach(c => data['Neutrals'][c.name] = c.hex);
        }
        // Add Semantics
        if (semanticPalette.length > 0) {
            data['System'] = {};
            semanticPalette.forEach(c => data['System'][c.name] = c.hex);
        }
        return JSON.stringify(data, null, 2);
  };

  // LIMIT CHECK: Edit Scale
  const handleEditClick = (color: ColorData) => {
      setSelectedColorForEdit(color);
  };

  const handleScaleSave = async (colorHex: string, newConfig: ScaleConfiguration) => {
      if (!selectedColorForEdit) return;
      
      // Create updated color with new config
      const updatedColor: ColorData = { ...selectedColorForEdit, scaleConfig: newConfig };
      
      // Update the color in the correct list based on activeTab
      if (activeTab === 'neutrals') {
          setNeutralPalette(prev => prev.map(c => c.hex === colorHex ? updatedColor : c));
      } else if (activeTab === 'system') {
          setSemanticPalette(prev => prev.map(c => c.hex === colorHex ? updatedColor : c));
      } else {
          // For 'brand' tab, update based on creation mode
          if (creationMode === 'manual') {
              // Update customColors (source of truth for manual mode)
              setCustomColors(prev => prev.map(c => c.hex === colorHex ? updatedColor : c));
              // Also update palette directly to reflect changes immediately
              setPalette(prev => prev.map(c => c.hex === colorHex ? updatedColor : c));
          } else {
              setPalette(prev => prev.map(c => c.hex === colorHex ? updatedColor : c));
          }
      }
      
      showToast("Color scale updated");
      setIsSaved(false);
  };

  const currentSkill = () => buildStudioColorSkill({
      paletteName,
      brand: palette,
      neutrals: neutralPalette,
      semantic: semanticPalette,
      globalConfig: globalCurveConfig,
  });

  const handleCopySkill = async () => {
      try {
          await navigator.clipboard.writeText(currentSkill());
          showToast('Copied color.md');
      } catch {
          showToast('Could not copy color.md');
      }
  };

  const handleDownloadSkill = () => {
      const blob = new Blob([currentSkill()], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'color.md';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded color.md');
  };

  // --- Storage Handlers (this browser only) ---
  const handleSavePalette = async () => {
      setIsSaving(true);
      try {
          const colorsToSave = creationMode === 'manual' ? customColors : palette;
          const newId = await savePaletteToFirestore('local', paletteName, colorsToSave);
          
          setIsSaved(true);
          
          const newPaletteEntry: SavedPalette = {
             id: newId,
             userId: 'local',
             name: paletteName,
             colors: colorsToSave,
             createdAt: { seconds: Date.now() / 1000 } 
          };
          setSavedPalettes(prev => [newPaletteEntry, ...prev]);
          showToast("Saved on this browser");
      } catch {
          showToast("Failed to save palette.");
      }
      setIsSaving(false);
  };

  const handleOpenLibrary = async () => {
      setIsLibraryOpen(true);
      setIsLibraryLoading(true);
      const data = await getUserPalettes('local');
      setSavedPalettes(data);
      setIsLibraryLoading(false);
  };

  const handleLoadPalette = (p: SavedPalette) => {
      handleApplyPalette(p.colors);
      setPaletteName(p.name);
      setIsLibraryOpen(false);
      setIsSaved(true); 
      showToast(`Loaded "${p.name}"`);
  };

  // Trigger modal instead of native confirm
  const handleDeleteRequest = (id: string) => {
      setPaletteToDelete(id);
  };

  // Actual Delete Logic (Called by Modal)
  const performDelete = async () => {
      if (!paletteToDelete) return;
      
      const id = paletteToDelete;
      setPaletteToDelete(null);
      setSavedPalettes(prev => prev.filter(p => p.id !== id));
      
      try {
        await deletePaletteFromFirestore(id);
        showToast("Palette deleted");
      } catch (e) {
        console.error(e);
        const palettes = await getUserPalettes('local');
        setSavedPalettes(palettes);
        showToast("Error deleting palette");
      }
  };

  const handleUpgradeCheckout = async () => {
      setIsCheckoutLoading(true);
      try {
          if (isDemoMode) {
              await createCheckoutSession('demo');
              return;
          }
          const billingUser = user ?? await ensureBillingUser();
          setUser(billingUser);
          await createCheckoutSession(billingUser.uid);
      } catch {
          showToast('Payments are unavailable right now.');
      } finally {
          setIsCheckoutLoading(false);
      }
  };

  const activeColors = activeTab === 'neutrals' ? neutralPalette : activeTab === 'system' ? semanticPalette : palette;
  const ModeButton = ({ mode, current, onClick, label }: { mode: InputMode, current: InputMode, onClick: (m: InputMode) => void, label: string }) => (<button onClick={() => onClick(mode)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${current === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>{label}</button>);
  const HarmonyButton = ({ type, label }: { type: HarmonyType, label: string }) => (<button onClick={() => setHarmony(type)} className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 border ${harmony === type ? 'bg-indigo-600 text-white shadow-lg border-indigo-500' : 'bg-slate-800 text-slate-500 hover:text-slate-200 hover:bg-slate-700 border-transparent'}`}><span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></button>);

  // --- RENDER LOGIC ---

  const renderGlobalOverlays = () => (
      <>
          <CookieConsent />
          <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
      </>
  );

  const renderSkillActions = () => (
      <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden">
          <button
              type="button"
              onClick={handleCopySkill}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
          >
              Copy color.md
          </button>
          <button
              type="button"
              onClick={handleDownloadSkill}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 border-l border-slate-700"
          >
              Download
          </button>
      </div>
  );

  // --- FULL SCREEN PLAYGROUND MODE ---
  if (viewMode === 'playground') {
      return (
          <div className="h-screen bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden">
              {renderGlobalOverlays()}
              <Toast message={toastMessage} isVisible={isToastVisible} />
              
              {/* Minimal Header for Playground */}
              <header className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40">
                   <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('grid')} className="text-slate-400 hover:text-white transition">
                            <HiArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <h1 className="text-lg font-bold text-white">Palette Playground</h1>
                   </div>
                   <div className="flex items-center gap-3">
                       <ThemeToggle />
                       {renderSkillActions()}
                       <button onClick={handleExportClick} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20">Export</button>
                   </div>
              </header>
              <div className="flex-1 overflow-hidden">
                  <UIPlayground 
                      brandPalette={creationMode === 'manual' ? customColors : palette}
                      neutralPalette={neutralPalette}
                      semanticPalette={semanticPalette}
                      config={playgroundConfig}
                      onConfigChange={setPlaygroundConfig}
                      globalConfig={globalCurveConfig}
                      isPremium={canUseAssistant}
                      onOpenPricing={() => setIsPricingOpen(true)}
                  />
              </div>
              
              {/* Shared Modals accessible from Playground */}
              {isExportOpen && <ExportModal brandPalette={palette} neutralPalette={neutralPalette} semanticPalette={semanticPalette} paletteName={paletteName} globalConfig={globalCurveConfig} onClose={() => setIsExportOpen(false)} />}
              
              {isPricingOpen && (
                  <PricingModal 
                      onClose={() => setIsPricingOpen(false)}
                      onCheckout={handleUpgradeCheckout}
                      isLoading={isCheckoutLoading}
                      limitType="ai"
                  />
              )}
              
              {paletteToDelete && (
                  <ConfirmModal 
                      title="Delete Palette?" 
                      message="This action cannot be undone. The palette will be permanently removed from your library."
                      onConfirm={performDelete}
                      onCancel={() => setPaletteToDelete(null)}
                      confirmText="Delete"
                      isDestructive={true}
                  />
              )}
          </div>
      );
  }

  return (
    <div className="h-[100dvh] bg-slate-950 text-slate-100 font-sans flex flex-col overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      {renderGlobalOverlays()}
      <Toast message={toastMessage} isVisible={isToastVisible} />
      
      {/* HEADER */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40">
           {/* ... (Existing Header content same as before) ... */}
           <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 cursor-pointer" onClick={handleGlobalReset}>
                    <img 
                        src="/logo.svg" 
                        alt="ChromaForge Logo" 
                        className="w-6 h-6 rounded-full"
                        style={{ objectFit: 'contain' }}
                    />
                    <h1 className="brand-wordmark text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">ChromaForge</h1>
                </div>
                {/* ... (Existing code) ... */}
                <div className="hidden md:flex items-center gap-2 pl-6 border-l border-white/5">
                     <HiPencil className="w-4 h-4 text-slate-500" />
                     <input type="text" value={paletteName} onChange={(e) => setPaletteName(e.target.value)} className="bg-transparent border-none text-sm font-medium text-slate-200 focus:ring-0 placeholder-slate-600 w-48 hover:text-white transition-colors" placeholder="Palette Name"/>
                </div>
           </div>

           <div className="flex items-center gap-3">
               <button 
                   onClick={handleTunerClick}
                   className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all text-xs font-bold uppercase tracking-wide mr-2 shadow-sm hover:shadow-md group"
                   title="Fix & Tune Scales"
               >
                   <div className="p-1 bg-indigo-500/10 rounded group-hover:bg-indigo-500/20 text-indigo-400 transition-colors">
                        <HiAdjustments className="w-3.5 h-3.5" />
                   </div>
                   Fix Palette
               </button>

               <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>

               {/* Library Button */}
               <button 
                   onClick={handleOpenLibrary}
                   className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                   title="My Palettes"
               >
                   <HiBookOpen className="w-5 h-5" />
               </button>

               {/* Save Button */}
               <button 
                   onClick={handleSavePalette}
                   className={`p-2 rounded-lg transition-colors ${isSaved ? 'text-pink-500 hover:text-pink-400' : 'text-slate-400 hover:text-pink-400 hover:bg-white/5'}`}
                   title="Save Palette"
                   disabled={isSaving}
               >
                   <HiHeart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
               </button>

               {renderSkillActions()}

               {/* Export Button */}
               <button 
                   onClick={handleExportClick}
                   className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 ml-2"
               >
                   Export
               </button>

               <ThemeToggle />
               {isPremium && (
                   <span className="hidden sm:inline text-[11px] text-slate-400">AI Pro</span>
               )}
           </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* SIDEBAR - Added pb-20 for mobile nav spacing */}
        <aside className={`w-full h-full md:h-auto flex-shrink-0 bg-slate-900 border-t md:border-t-0 md:border-r border-white/5 flex flex-col z-30 shadow-2xl relative pb-20 md:pb-0 transition-all duration-300 ${isSidebarExpanded ? 'md:w-[400px]' : 'md:w-[24px]'} ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`absolute z-40 w-6 h-6 bg-slate-800 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-all shadow-lg hover:scale-110 ${isSidebarExpanded ? '-right-3 top-6' : 'right-1 top-6'}`}
                title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                {isSidebarExpanded ? (
                    <HiChevronRight className="w-4 h-4" />
                ) : (
                    <HiChevronRight className="w-4 h-4 rotate-180" />
                )}
            </button>
            {isSidebarExpanded && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                
                {/* Creation Mode Toggle */}
                <div className="p-4 border-b border-white/5 bg-slate-900 sticky top-0 z-20">
                    <div className="bg-slate-950 p-1 rounded-xl border border-white/5 flex relative">
                        <div 
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-sm transition-all duration-300 ease-in-out border border-white/5 ${creationMode === 'manual' ? 'left-[calc(50%+2px)]' : 'left-1'}`}
                        />
                        <button 
                            onClick={() => setCreationMode('generator')} 
                            className="flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-lg flex items-center justify-center gap-2 text-white"
                        >
                            Generator
                        </button>
                        <button 
                            onClick={() => setCreationMode('manual')} 
                            className="flex-1 relative z-10 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded-lg flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300"
                        >
                            Manual
                        </button>
                    </div>
                </div>

                {/* --- GLOBAL CURVE CONTROLS --- */}
                <div className="p-6 border-b border-white/5 bg-slate-900/50">
                    <h3 
                        onClick={() => setIsCurveControlsOpen(!isCurveControlsOpen)}
                        className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center cursor-pointer hover:text-slate-300 transition-colors select-none group w-full mb-2"
                    >
                        <div className="flex items-center gap-2">
                            <HiChevronRight className={`w-4 h-4 transition-transform duration-200 text-slate-600 group-hover:text-slate-400 ${isCurveControlsOpen ? 'rotate-90' : ''}`} />
                            Curve Controls
                        </div>
                    </h3>
                    
                    {isCurveControlsOpen && (
                        <div className="space-y-6 mt-4 animate-in slide-in-from-top-2 duration-200 fade-in-0">
                            
                            {/* Global Steps Slider */}
                            <div className="group/slider relative">
                                <div className="flex justify-between mb-1.5 items-end">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Scale Steps</label>
                                    <span className="text-[10px] font-mono text-white">{globalCurveConfig.steps}</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                    <div className="absolute inset-0 bg-indigo-500/20"></div>
                                    <input 
                                        type="range" min="3" max="21" step="1"
                                        value={globalCurveConfig.steps} 
                                        onChange={(e) => setGlobalCurveConfig({...globalCurveConfig, steps: Number(e.target.value)})} 
                                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                    />
                                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75" style={{ left: `${((globalCurveConfig.steps - 3) / 18) * 100}%`, transform: 'translate(-50%, -50%)' }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1 uppercase font-bold"><span>3</span><span>21</span></div>
                            </div>

                            {/* Vibrancy */}
                            <div className="group/slider relative">
                                <div className="flex justify-between mb-1.5 items-end">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Vibrancy</label>
                                    <span className={`text-[10px] font-mono ${globalCurveConfig.vibrancy !== 0 ? 'text-indigo-400' : 'text-slate-300'}`}>{globalCurveConfig.vibrancy}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-indigo-500 opacity-20"></div>
                                    <input 
                                        type="range" min="-100" max="100" step="5"
                                        value={globalCurveConfig.vibrancy} 
                                        onChange={(e) => setGlobalCurveConfig({...globalCurveConfig, vibrancy: Number(e.target.value)})} 
                                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                    />
                                    {/* Midpoint Marker */}
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-slate-600 rounded-full pointer-events-none"></div>
                                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75" style={{ left: `${((globalCurveConfig.vibrancy + 100)/200)*100}%`, transform: 'translate(-50%, -50%)' }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1 uppercase font-bold"><span>Muted</span><span>Vibrant</span></div>
                            </div>

                            {/* Contrast */}
                            <div className="group/slider relative">
                                <div className="flex justify-between mb-1.5 items-end">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Contrast</label>
                                    <span className={`text-[10px] font-mono ${globalCurveConfig.contrast !== 0 ? 'text-indigo-400' : 'text-slate-300'}`}>{globalCurveConfig.contrast}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-white opacity-20"></div>
                                    <input 
                                        type="range" min="-100" max="100" step="5"
                                        value={globalCurveConfig.contrast} 
                                        onChange={(e) => setGlobalCurveConfig({...globalCurveConfig, contrast: Number(e.target.value)})} 
                                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                    />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-slate-600 rounded-full pointer-events-none"></div>
                                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75" style={{ left: `${((globalCurveConfig.contrast + 100)/200)*100}%`, transform: 'translate(-50%, -50%)' }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1 uppercase font-bold"><span>Compressed</span><span>Expanded</span></div>
                            </div>

                            {/* Hue Torsion */}
                            <div className="group/slider relative">
                                <div className="flex justify-between mb-1.5 items-end">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Hue Blend</label>
                                    <span className={`text-[10px] font-mono ${globalCurveConfig.hueTorsion !== 0 ? 'text-indigo-400' : 'text-slate-300'}`}>{globalCurveConfig.hueTorsion > 0 ? '+' : ''}{globalCurveConfig.hueTorsion}°</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-slate-700 to-orange-500 opacity-20"></div>
                                    <input 
                                        type="range" min="-60" max="60" step="5"
                                        value={globalCurveConfig.hueTorsion} 
                                        onChange={(e) => setGlobalCurveConfig({...globalCurveConfig, hueTorsion: Number(e.target.value)})} 
                                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                    />
                                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-slate-600 rounded-full pointer-events-none"></div>
                                    <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75" style={{ left: `${((globalCurveConfig.hueTorsion + 60)/120)*100}%`, transform: 'translate(-50%, -50%)' }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-600 mt-1 uppercase font-bold"><span>Cooler</span><span>Warmer</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- REST OF SIDEBAR (Generator/Manual inputs) --- */}
                {creationMode === 'generator' && (
                    <div className="p-6 space-y-6">
                        {/* Base Color Input */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Base Color</label>
                            <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-white/5 focus-within:border-indigo-500/50 transition-colors">
                                <div className="w-10 h-10 rounded-lg shadow-inner ring-1 ring-white/10" style={{ backgroundColor: palette[0]?.hex || '#5A7396' }}></div>
                                <div className="flex-1">
                                    <input 
                                        type="text" 
                                        value={localHexInput}
                                        onChange={handleManualHexInput}
                                        className="bg-transparent border-none p-0 text-sm font-mono font-bold text-white w-full focus:ring-0 uppercase placeholder-slate-700"
                                        placeholder="#5A7396"
                                    />
                                </div>
                                <button onClick={handleEyeDropper} className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors">
                                    <FaEyeDropper className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Luminance Slider */}
                        <div className="group/slider relative">
                             <div className="flex justify-between mb-1.5 items-end">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase">Luminance</label>
                                 <span className="text-[10px] font-mono text-slate-300">{brightness}%</span>
                             </div>
                             <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                <div className="absolute inset-0 bg-gradient-to-r from-black to-white opacity-20"></div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={brightness} 
                                    onChange={(e) => setBrightness(Number(e.target.value))} 
                                    className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75" style={{ left: `${brightness}%`, transform: 'translate(-50%, -50%)' }} />
                            </div>
                        </div>

                        {/* Hue Slider (for 3D mode) */}
                        {inputMode === '3d' && (
                            <>
                                <div className="group/slider relative">
                                    <div className="flex justify-between mb-1.5 items-end">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Hue</label>
                                        <span className="text-[10px] font-mono text-slate-300">{baseColor.h}°</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 opacity-60 rounded-full"></div>
                                        <input 
                                            type="range" min="0" max="360" 
                                            value={baseColor.h} 
                                            onChange={(e) => handleWheelChange({ ...baseColor, h: Number(e.target.value) })} 
                                            className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75 border border-slate-900" style={{ left: `${(baseColor.h / 360) * 100}%`, transform: 'translate(-50%, -50%)' }} />
                                    </div>
                                </div>

                                {/* Saturation Slider (for 3D mode) */}
                                <div className="group/slider relative">
                                    <div className="flex justify-between mb-1.5 items-end">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Saturation</label>
                                        <span className="text-[10px] font-mono text-slate-300">{baseColor.s}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full relative w-full overflow-hidden group-hover/slider:bg-slate-700 transition-colors">
                                        <div className="absolute inset-0 bg-gradient-to-r opacity-60 rounded-full" style={{ 
                                            background: `linear-gradient(to right, hsl(${baseColor.h}, 0%, ${brightness}%), hsl(${baseColor.h}, 100%, ${brightness}%))` 
                                        }}></div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={baseColor.s} 
                                            onChange={(e) => handleWheelChange({ ...baseColor, s: Number(e.target.value) })} 
                                            className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-white rounded-full shadow-sm pointer-events-none transition-all duration-75 border border-slate-900" style={{ left: `${baseColor.s}%`, transform: 'translate(-50%, -50%)' }} />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Color Wheel & Harmonies - Keeping existing layout */}
                        <div className="flex justify-center pt-12 pb-4 relative">
                             <div className="absolute top-0 right-0 flex bg-slate-950/80 backdrop-blur-sm rounded-lg p-0.5 border border-white/5 z-10">
                                <ModeButton mode="wheel" current={inputMode} onClick={setInputMode} label="Wheel" />
                                <ModeButton mode="curves" current={inputMode} onClick={setInputMode} label="Curves" />
                                <ModeButton mode="3d" current={inputMode} onClick={setInputMode} label="3D" />
                             </div>
                             <ColorWheel 
                                mode={inputMode} 
                                baseColor={baseColor} 
                                onChange={handleWheelChange} 
                                brightness={brightness} 
                                isPrintMode={isPrintMode} 
                                isMixing={false}
                                harmonyColors={palette.slice(1)} 
                             />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <HarmonyButton type="monochromatic" label="Mono" />
                            <HarmonyButton type="analogous" label="Analog" />
                            <HarmonyButton type="complementary" label="Comp" />
                            <HarmonyButton type="split-complementary" label="Split" />
                            <HarmonyButton type="triadic" label="Triad" />
                            <HarmonyButton type="square" label="Square" />
                        </div>
                    </div>
                )}

                {/* Manual Mode */}
                {creationMode === 'manual' && (
                    <div className="p-6 space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Custom Colors</label>
                            <span className="text-[10px] text-slate-600">{customColors.length}</span>
                        </div>
                        <div className="space-y-3">
                            {customColors.map((color, idx) => (
                                <ColorRowInput 
                                    key={idx} 
                                    color={color} 
                                    index={idx}
                                    onChange={(newColor) => handleUpdateCustomColor(idx, newColor)}
                                    onDelete={() => handleDeleteCustomColor(idx)}
                                    canDelete={customColors.length > 1}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleAddCustomColor} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2">
                                <HiPlus className="w-4 h-4" />
                                Add Color
                            </button>
                            <button onClick={() => setIsImportOpen(true)} className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition-all">
                                <HiUpload className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* AI Generator Footer */}
                {isSidebarExpanded && (
                <div className="mt-auto border-t border-white/5 bg-slate-950 relative">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <HiSparkles className="w-4 h-4" />
                            AI Designer
                        </h3>
                        {!canUseAssistant && (
                            <button
                                type="button"
                                onClick={() => setIsPricingOpen(true)}
                                className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400"
                            >
                                Subscribe
                            </button>
                        )}
                    </div>
                    <div className={`transition-all duration-300 ease-in-out ${isChatOpen ? 'h-64' : 'h-0'} overflow-hidden bg-slate-900`}>
                        <div className="h-full overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {messages.length === 0 && <p className="text-xs text-slate-500 text-center mt-4">Describe a brand or mood. A reply with colors replaces the brand list. An empty reply is not billed.</p>}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-3 py-2 rounded-lg text-xs max-w-[90%] leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                        {msg.text}
                                    </div>
                                    {msg.palettePreview && (
                                        <div className="flex gap-1 mt-1.5 p-1 bg-slate-800 rounded-md border border-slate-700 cursor-pointer hover:border-indigo-500 transition-colors" onClick={() => handleApplyPalette(msg.palettePreview!)}>
                                            {msg.palettePreview.map((c, idx) => (
                                                <div key={idx} className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} title={c.name}></div>
                                            ))}
                                            <span className="text-[9px] text-slate-500 ml-1">Apply</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex flex-col items-start">
                                    <div className="px-3 py-2 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                                        <div className="flex items-center gap-2">
                                            <div className="relative w-4 h-4">
                                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <defs>
                                                        <linearGradient id="mac-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#ff6b6b" />
                                                            <stop offset="14.28%" stopColor="#ffa500" />
                                                            <stop offset="28.57%" stopColor="#ffd700" />
                                                            <stop offset="42.85%" stopColor="#90ee90" />
                                                            <stop offset="57.14%" stopColor="#4ecdc4" />
                                                            <stop offset="71.42%" stopColor="#45b7d1" />
                                                            <stop offset="85.71%" stopColor="#96ceb4" />
                                                            <stop offset="100%" stopColor="#ff6b6b" />
                                                        </linearGradient>
                                                    </defs>
                                                    <circle cx="8" cy="8" r="6" stroke="url(#mac-spinner-gradient)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 20" fill="none" opacity="0.8">
                                                        <animateTransform
                                                            attributeName="transform"
                                                            type="rotate"
                                                            from="0 8 8"
                                                            to="360 8 8"
                                                            dur="0.8s"
                                                            repeatCount="indefinite"
                                                        />
                                                    </circle>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                    <div className="p-3 bg-slate-950">
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition-colors"
                                placeholder="Ask AI..."
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleChatSubmit();
                                    }
                                }}
                                onFocus={() => setIsChatOpen(true)}
                            />
                            <button 
                                type="button"
                                onClick={handleChatSubmit}
                                disabled={isChatLoading || !chatInput.trim()} 
                                className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 rounded-md text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                <FaPaperPlane className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
                )}
            </div>
            )}
        </aside>

        {/* ... (Main Content, Modals - Existing logic) ... */}
        <main className={`flex-1 flex flex-col min-w-0 bg-[#020617] relative pb-20 md:pb-0 overflow-hidden ${mobileTab === 'canvas' ? 'flex' : 'hidden md:flex'}`}>
            {/* Same as previous main logic, just ensuring props are passed to components */}
            <div className="h-12 border-b border-white/5 flex items-center px-6 gap-6 bg-slate-950/30 sticky top-0 z-20 backdrop-blur-md shrink-0">
                {(['brand', 'neutrals', 'system'] as PaletteTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1 ${activeTab === tab ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                ))}
                
                {/* --- RESTORED VIEW TOGGLES --- */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-white/5 ml-4">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="Grid View">
                        <HiViewGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('card3d')} className={`p-1.5 rounded-md transition-all ${viewMode === 'card3d' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="3D Cards">
                        <HiCube className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('voxel')} className={`p-1.5 rounded-md transition-all ${viewMode === 'voxel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="Voxel View">
                        <FaCubes className="w-4 h-4" />
                    </button>
                    <button onClick={() => setViewMode('gradients')} className={`p-1.5 rounded-md transition-all ${viewMode === 'gradients' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`} title="Gradient View">
                        <FaPalette className="w-4 h-4" />
                    </button>
                </div>

                <div className="h-4 w-px bg-white/10 mx-2"></div>
                <button onClick={() => setViewMode('playground')} className="h-full text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-1 flex items-center gap-2 border-transparent text-slate-500 hover:text-slate-300">Palette Playground</button>
                <div className="ml-auto flex items-center gap-3">
                    
                    {/* Compact View Toggle (Grid Mode Only) */}
                    {viewMode === 'grid' && (
                        <button 
                            onClick={() => setIsCompactView(!isCompactView)}
                            className={`hidden md:flex items-center gap-2 px-2 py-1 rounded transition-colors ${isCompactView ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white'}`}
                            title={isCompactView ? "Switch to Expanded Cards" : "Switch to Compact List"}
                        >
                            {isCompactView ? (
                                // Show "Cards/Grid" icon to indicate action to Expand
                                <HiViewGrid className="w-4 h-4" />
                            ) : (
                                // Show "List/Rows" icon to indicate action to Compact
                                <HiMenu className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsPrintMode(!isPrintMode)}>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isPrintMode ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isPrintMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPrintMode ? 'text-white' : 'text-slate-500'}`}>Print (CMYK)</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {viewMode === 'gradients' ? (
                    <GradientList colors={activeColors} onCopy={(t) => { navigator.clipboard.writeText(t); showToast("CSS Copied!"); }} />
                ) : viewMode === 'voxel' ? (
                     <div className="h-[600px] w-full">
                        <VoxelVisualization palette={activeColors} />
                     </div>
                ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid' || viewMode === 'card3d' ? (isCompactView ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3') : 'grid-cols-1'}`}>
                        {activeColors.map((color, idx) => (
                            <React.Fragment key={idx}>
                                {viewMode === 'grid' && (
                                    <PaletteCard 
                                        color={color} 
                                        onOpenInfo={setSelectedColorForInfo} 
                                        onOpenGrid={setSelectedColorForGrid}
                                        onEditScale={handleEditClick}
                                        onCopy={(hex) => { navigator.clipboard.writeText(hex); showToast(`Copied ${hex}`); }}
                                        onColorUpdate={(updatedColor) => {
                                            if (activeTab === 'neutrals') {
                                                setNeutralPalette(prev => prev.map((c, i) => i === idx ? updatedColor : c));
                                            } else if (activeTab === 'system') {
                                                setSemanticPalette(prev => prev.map((c, i) => i === idx ? updatedColor : c));
                                            } else {
                                                setPalette(prev => prev.map((c, i) => i === idx ? updatedColor : c));
                                            }
                                            setIsSaved(false);
                                        }}
                                        isPrintMode={isPrintMode}
                                        isCompact={isCompactView}
                                        globalConfig={globalCurveConfig} // Pass steps here
                                    />
                                )}
                                {viewMode === 'card3d' && <PaletteCard3D color={color} />}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>
        </main>
      </div>

      {/* --- MOBILE NAVIGATION BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-white/10 z-50 flex justify-around items-center px-6">
          <button 
              onClick={() => setMobileTab('editor')}
              className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'editor' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <HiAdjustments className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Generator</span>
          </button>
          
          <button 
              onClick={() => setMobileTab('canvas')}
              className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'canvas' ? 'text-indigo-400' : 'text-slate-500'}`}
          >
              <HiViewGrid className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">Palettes</span>
          </button>
      </div>

      {/* Modals */}
      {selectedColorForEdit && (() => {
          // Get the updated color from the active list to ensure scaleConfig is current
          const currentColor = activeColors.find(c => c.hex === selectedColorForEdit.hex) || selectedColorForEdit;
          return <ScaleEditorModal color={currentColor} onClose={() => setSelectedColorForEdit(null)} onSave={handleScaleSave} isPremium />;
      })()}
      {isExportOpen && <ExportModal brandPalette={palette} neutralPalette={neutralPalette} semanticPalette={semanticPalette} paletteName={paletteName} globalConfig={globalCurveConfig} onClose={() => setIsExportOpen(false)} />}
      {isTunerOpen && <PaletteTunerModal onClose={() => setIsTunerOpen(false)} isPremium initialCode={getTunerCode()} />}
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} onImport={handleImport} limit={200} isPremium />}
      {isLibraryOpen && <PaletteLibraryModal palettes={savedPalettes} isLoading={isLibraryLoading} onClose={() => setIsLibraryOpen(false)} onLoadPalette={handleLoadPalette} onDeletePalette={handleDeleteRequest} isPremium />}
      {isPricingOpen && <PricingModal onClose={() => setIsPricingOpen(false)} onCheckout={handleUpgradeCheckout} isLoading={isCheckoutLoading} limitType="ai" />}
      {selectedColorForInfo && <ColorInfo color={selectedColorForInfo} onClose={() => setSelectedColorForInfo(null)} />}
      {selectedColorForGrid && <ContrastGrid color={selectedColorForGrid} onClose={() => setSelectedColorForGrid(null)} />}
      {is3DOpen && <Palette3DModal palette={activeColors} paletteName={paletteName} onClose={() => setIs3DOpen(false)} />}
      {paletteToDelete && <ConfirmModal title="Delete Palette?" message="This action cannot be undone." onConfirm={performDelete} onCancel={() => setPaletteToDelete(null)} confirmText="Delete" isDestructive={true} />}
    </div>
  );
};

export default App;
