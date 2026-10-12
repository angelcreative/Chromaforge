
import { ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Heart, LayoutGrid, Loader2, Menu, Palette, Pencil, Pipette, Plus, Send, SlidersHorizontal, Sparkles, Upload } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ColorHSL, ColorData, HarmonyType, ChatMessage, ScaleConfiguration, InputMode, PaletteTab, PlaygroundConfig, GlobalCurveConfig } from './types';
import { generateHarmonies, createColorDataFromHSL, hexToHsl, deduplicateColorNames, generateNeutrals, generateSemantics, createColorData, hslToRgb, rgbToHex } from './utils/colorUtils';
import ColorWheel from './components/ColorWheel';
import { generatePaletteFromPrompt } from './services/geminiService';
import ContrastGrid from './components/ContrastGrid';
import ColorInfo from './components/ColorInfo';
import PaletteCard from './components/PaletteCard';
import ExportModal from './components/ExportModal';
import PaletteTunerModal from './components/PaletteTunerModal';
import ScaleEditorModal from './components/ScaleEditorModal';
import ColorRowInput from './components/ColorRowInput';
import ImportModal from './components/ImportModal';
import UIPlayground from './components/UIPlayground';
import GradientList from './components/GradientList';
import { ntc } from './utils/ntc';
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
    <div className="fixed top-16 left-1/2 z-[150] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
      <div className="bg-card text-card-foreground border border-border px-4 py-3 rounded-2xl shadow-panel flex items-center gap-3">
         <div className="bg-accent p-1.5 rounded-full">
            <Check className="w-4 h-4 text-foreground" strokeWidth={1.5}/>
         </div>
         <span className="font-medium text-[13px]">{message}</span>
      </div>
    </div>
  );
};

type MobileTab = 'canvas' | 'editor';
type ViewMode = 'grid' | 'playground' | 'gradients';
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
  const [studioPane, setStudioPane] = useState<'composer' | 'refine' | 'colors'>('composer');
  const [refineIndex, setRefineIndex] = useState(0);
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

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isChatLoading, studioPane]);

  const showToast = (msg: string) => { setToastMessage(msg); setIsToastVisible(true); setTimeout(() => setIsToastVisible(false), 2500); };

  const handleGlobalReset = () => {
    setBaseColor({ h: 215, s: 25, l: 47 }); setBrightness(47); setHarmony('monochromatic'); setPaletteName('Design Tokens');
    setMessages([]); setChatInput(''); setIsPrintMode(false); setActiveTab('brand');
    setViewMode('grid');
    setCreationMode('generator');
    setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    setGlobalCurveConfig({ vibrancy: 0, contrast: 0, hueTorsion: 0, steps: 11 }); // Reset global controls
    setIsSaved(false);
    setStudioPane('composer');
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
  const workingColors = creationMode === 'manual' ? customColors : palette;
  const hasPalette = workingColors.length > 0;
  const pendingRequest = [...messages].reverse().find((message) => message.role === 'user')?.text ?? '';
  const HarmonyButton = ({ type, label }: { type: HarmonyType, label: string }) => (<button onClick={() => setHarmony(type)} className={`flex h-9 items-center justify-center rounded-lg border transition-colors ${harmony === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent border-border'}`}><span className="text-[13px]">{label}</span></button>);

  const openColors = () => {
    if (creationMode === 'generator') {
      const seed = palette.length > 0 ? palette.map((color) => ({ ...color })) : [createColorData('#5A7396', undefined, 'Primary')];
      setCustomColors(seed);
      setCreationMode('manual');
    } else if (customColors.length === 0) {
      setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    }
    setStudioPane('colors');
  };

  const openRefine = (index = 0) => {
    const list = creationMode === 'manual' ? customColors : palette;
    if (list.length === 0) return;
    const safe = Math.min(Math.max(index, 0), list.length - 1);
    setRefineIndex(safe);
    setLocalHexInput(list[safe].hex.toUpperCase());
    setStudioPane('refine');
  };

  const refineLightness = creationMode === 'generator'
    ? brightness
    : (customColors[refineIndex]?.hsl.l ?? brightness);

  const handleRefineWheel = (hsl: ColorHSL) => {
    if (creationMode === 'generator') {
      setBaseColor(hsl);
      if (harmony === 'custom') setHarmony('monochromatic');
      return;
    }
    setCustomColors(prev => prev.map((color, index) => {
      if (index !== refineIndex) return color;
      const next = createColorDataFromHSL(hsl.h, hsl.s, hsl.l, color.name);
      return { ...next, scaleConfig: color.scaleConfig };
    }));
    setLocalHexInput(createColorDataFromHSL(hsl.h, hsl.s, hsl.l).hex.toUpperCase());
  };

  const setRefineLightness = (value: number) => {
    if (creationMode === 'generator') {
      setBrightness(value);
      return;
    }
    const current = customColors[refineIndex];
    if (!current) return;
    handleRefineWheel({ ...current.hsl, l: value });
  };

  const refineBase: ColorHSL = creationMode === 'generator'
    ? baseColor
    : (customColors[refineIndex]?.hsl ?? baseColor);

  const pickRefineFromScreen = async () => {
    if (!window.EyeDropper) return;
    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const hsl = hexToHsl(result.sRGBHex);
      handleRefineWheel({ ...hsl, l: refineLightness });
      setLocalHexInput(result.sRGBHex.toUpperCase());
    } catch {
      /* cancelled */
    }
  };

  // --- RENDER LOGIC ---

  const renderGlobalOverlays = () => (
      <>
          <CookieConsent />
          <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />
      </>
  );

  const renderSkillActions = () => (
      <div className="flex items-center overflow-hidden rounded-lg border border-border bg-background">
          <button
              type="button"
              onClick={handleCopySkill}
              className="h-8 px-2.5 text-[13px] text-foreground hover:bg-accent"
          >
              Copy color.md
          </button>
          <button
              type="button"
              onClick={handleDownloadSkill}
              className="h-8 border-l border-border px-2.5 text-[13px] text-foreground hover:bg-accent"
          >
              Download
          </button>
      </div>
  );

  // --- FULL SCREEN PLAYGROUND MODE ---
  if (viewMode === 'playground') {
      return (
          <div className="h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
              {renderGlobalOverlays()}
              <Toast message={toastMessage} isVisible={isToastVisible} />
              
              <header className="h-14 bg-sidebar border-b border-border flex items-center justify-between px-4 shrink-0 z-40">
                   <div className="flex items-center gap-3">
                        <button onClick={() => setViewMode('grid')} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors" aria-label="Back to studio">
                            <ArrowRight className="w-4 h-4 rotate-180" strokeWidth={1.5}/>
                        </button>
                        <h1 className="text-[15px] font-medium text-foreground">Palette playground</h1>
                   </div>
                   <div className="flex items-center gap-2">
                       <ThemeToggle />
                       {renderSkillActions()}
                       <button onClick={handleExportClick} className="h-8 rounded-lg bg-primary px-3 text-[13px] text-primary-foreground hover:opacity-90">Export</button>
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
    <div className="h-[100dvh] bg-canvas text-foreground font-sans flex flex-col overflow-hidden">
      {renderGlobalOverlays()}
      <Toast message={toastMessage} isVisible={isToastVisible} />

      <header className="h-14 bg-sidebar border-b border-border flex items-center justify-between gap-3 px-4 shrink-0 z-40 overflow-x-auto">
           <div className="flex min-w-0 items-center gap-3">
                <button type="button" className="flex items-center gap-2" onClick={handleGlobalReset}>
                    <img
                        src="/logo.svg"
                        alt="ChromaForge"
                        className="w-6 h-6 rounded-full"
                        style={{ objectFit: 'contain' }}
                    />
                    <h1 className="hidden text-[15px] font-medium tracking-tight text-foreground sm:block">ChromaForge</h1>
                </button>
                <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
                     <Pencil className="w-4 h-4 text-muted-foreground" strokeWidth={1.5}/>
                     <input type="text" value={paletteName} onChange={(e) => setPaletteName(e.target.value)} className="bg-transparent border-none text-sm font-medium text-foreground focus:ring-0 placeholder:text-muted-foreground w-48" placeholder="Palette name" aria-label="Palette name"/>
                </div>
           </div>

           <div className="flex items-center gap-2">
               <ThemeToggle />
               <button
                   type="button"
                   onClick={handleOpenLibrary}
                   className="grid size-9 place-items-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                   aria-label="Saved palettes"
               >
                   <BookOpen className="w-5 h-5" strokeWidth={1.5}/>
               </button>
               <button
                   type="button"
                   onClick={handleSavePalette}
                   className={`grid size-9 place-items-center rounded-lg ${isSaved ? 'text-pink-500' : 'text-muted-foreground hover:text-pink-400 hover:bg-accent'}`}
                   aria-label={isSaved ? 'Palette saved' : 'Save palette'}
                   disabled={isSaving}
               >
                   <Heart className="w-5 h-5" strokeWidth={1.5}/>
               </button>
               <div className="hidden lg:contents">{renderSkillActions()}</div>
               <button
                   type="button"
                   onClick={handleExportClick}
                   className="h-8 rounded-lg bg-primary px-3 text-[13px] text-primary-foreground hover:opacity-90"
               >
                   Export
               </button>
           </div>
      </header>

      {studioPane === 'refine' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6">
            <button type="button" onClick={() => setStudioPane('composer')} className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-1 text-[13px] text-foreground hover:bg-accent">
              <ChevronLeft className="size-4" strokeWidth={1.5} />
              Back to composer
            </button>
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Refine color</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">Adjust this color, then return to the composer and the ramp.</p>
            </div>
            {creationMode === 'manual' && customColors.length > 1 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Color to refine">
                {customColors.map((color, index) => (
                  <button
                    key={`${color.hex}-${index}`}
                    type="button"
                    onClick={() => { setRefineIndex(index); setLocalHexInput(color.hex.toUpperCase()); }}
                    className={`h-10 w-10 rounded-lg ring-2 ring-offset-2 ring-offset-background ${refineIndex === index ? 'ring-foreground' : 'ring-transparent'}`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                    aria-pressed={refineIndex === index}
                  />
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
              <div className="size-10 rounded-lg ring-1 ring-border" style={{ backgroundColor: creationMode === 'manual' ? customColors[refineIndex]?.hex : palette[0]?.hex }} />
              <input
                type="text"
                value={localHexInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setLocalHexInput(val);
                  if (/^#[0-9A-F]{6}$/i.test(val)) handleRefineWheel(hexToHsl(val));
                }}
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground focus:outline-none"
                aria-label="Hex"
              />
              <button type="button" onClick={pickRefineFromScreen} className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Pick color from screen">
                <Pipette className="size-4" strokeWidth={1.5} />
              </button>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-[13px] text-muted-foreground">
                <label htmlFor="refine-lightness">Luminance</label>
                <span className="font-mono text-foreground">{Math.round(refineLightness)}%</span>
              </div>
              <input id="refine-lightness" type="range" min={0} max={100} value={refineLightness} onChange={(e) => setRefineLightness(Number(e.target.value))} className="w-full" />
            </div>
            <div className="flex justify-center">
              <ColorWheel
                mode="wheel"
                baseColor={refineBase}
                onChange={handleRefineWheel}
                brightness={refineLightness}
                isPrintMode={isPrintMode}
                isMixing={false}
                harmonyColors={creationMode === 'generator' ? palette.slice(1) : []}
              />
            </div>
            {creationMode === 'generator' && (
              <div className="grid grid-cols-3 gap-2">
                <HarmonyButton type="monochromatic" label="Mono" />
                <HarmonyButton type="analogous" label="Analog" />
                <HarmonyButton type="complementary" label="Complement" />
                <HarmonyButton type="split-complementary" label="Split" />
                <HarmonyButton type="triadic" label="Triad" />
                <HarmonyButton type="square" label="Square" />
              </div>
            )}
            <button type="button" onClick={() => setStudioPane('composer')} className="h-11 rounded-xl bg-primary text-[13px] text-primary-foreground hover:opacity-90">
              Done
            </button>
          </div>
        </div>
      ) : studioPane === 'colors' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6">
            <button type="button" onClick={() => setStudioPane('composer')} className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-1 text-[13px] text-foreground hover:bg-accent">
              <ChevronLeft className="size-4" strokeWidth={1.5} />
              Back to composer
            </button>
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Edit colors</h2>
              <p className="mt-2 text-[15px] text-muted-foreground">Add or change colors without the assistant. The ramp updates when you go back.</p>
            </div>
            <div className="space-y-3">
              {customColors.map((color, idx) => (
                <ColorRowInput
                  key={`${color.hex}-${idx}`}
                  color={color}
                  index={idx}
                  onChange={(newColor) => handleUpdateCustomColor(idx, newColor)}
                  onDelete={() => handleDeleteCustomColor(idx)}
                  canDelete={customColors.length > 1}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleAddCustomColor} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card text-[13px] text-foreground hover:bg-accent">
                <Plus className="size-4" strokeWidth={1.5} />
                Add color
              </button>
              <button type="button" onClick={() => setIsImportOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent">
                <Upload className="size-4" strokeWidth={1.5} />
                Import
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className={`mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 ${isChatLoading ? 'min-h-full flex-1' : ''}`}>
              {isChatLoading ? (
                <div
                  className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  {pendingRequest && (
                    <p className="max-w-md text-2xl font-medium tracking-tight text-foreground">{pendingRequest}</p>
                  )}
                  <Loader2 className="mt-8 size-8 animate-spin text-foreground" strokeWidth={1.5} aria-hidden />
                  <p className="mt-3 text-[15px] text-muted-foreground">Making a palette</p>
                </div>
              ) : (
              <>
              {messages.length === 0 && (
                <div className="pt-4">
                  <h2 className="text-2xl font-medium tracking-tight text-foreground">Describe a palette</h2>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                    Ask for a brand, a mood, or a product. A reply with colors becomes the palette. The assistant is the only paid part of the studio.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground ring-1 ring-border'}`}>
                      {msg.text}
                    </div>
                    {msg.palettePreview && (
                      <button
                        type="button"
                        className="mt-2 flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 hover:bg-accent"
                        onClick={() => handleApplyPalette(msg.palettePreview!)}
                      >
                        {msg.palettePreview.map((c, idx) => (
                          <span key={idx} className="size-4 rounded-full ring-1 ring-border" style={{ backgroundColor: c.hex }} />
                        ))}
                        <span className="px-1 text-[13px] text-foreground">Apply</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {hasPalette && (
                <section className="rounded-2xl bg-card p-4 ring-1 ring-border shadow-panel">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={paletteName}
                      onChange={(e) => setPaletteName(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground focus:outline-none md:hidden"
                      aria-label="Palette name"
                    />
                    <div className="flex gap-1">
                      {(['brand', 'neutrals', 'system'] as PaletteTab[]).map(tab => (
                        <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`h-8 rounded-lg px-2.5 text-[13px] capitalize ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>{tab}</button>
                      ))}
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setViewMode(viewMode === 'gradients' ? 'grid' : 'gradients')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[13px] text-foreground hover:bg-accent">
                        {viewMode === 'gradients' ? <LayoutGrid className="size-3.5" strokeWidth={1.5} /> : <Palette className="size-3.5" strokeWidth={1.5} />}
                        {viewMode === 'gradients' ? 'Ramps' : 'Gradients'}
                      </button>
                      <button type="button" onClick={() => setViewMode('playground')} className="h-8 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">Playground</button>
                    </div>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => setIsCurveControlsOpen(!isCurveControlsOpen)} className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
                      <ChevronRight className={`size-4 transition-transform ${isCurveControlsOpen ? 'rotate-90' : ''}`} strokeWidth={1.5} />
                      Ramp settings
                    </button>
                    <button type="button" className="ml-auto flex items-center gap-2" onClick={() => setIsPrintMode(!isPrintMode)} aria-pressed={isPrintMode}>
                      <span className={`relative h-5 w-9 rounded-full ${isPrintMode ? 'bg-primary' : 'bg-[var(--switch)]'}`}>
                        <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm ring-1 ring-black/10 transition-transform ${isPrintMode ? 'translate-x-3.5' : ''}`} />
                      </span>
                      <span className="text-[13px] text-foreground">Print (CMYK)</span>
                    </button>
                    {viewMode === 'grid' && (
                      <button type="button" onClick={() => setIsCompactView(!isCompactView)} className="hidden h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] text-muted-foreground hover:bg-accent md:inline-flex" aria-pressed={isCompactView}>
                        <Menu className="size-4" strokeWidth={1.5} />
                        {isCompactView ? 'Cards' : 'List'}
                      </button>
                    )}
                  </div>

                  {isCurveControlsOpen && (
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      <label className="block text-[13px] text-muted-foreground">
                        Scale steps
                        <span className="float-right font-mono text-foreground">{globalCurveConfig.steps}</span>
                        <input type="range" min={3} max={21} step={1} value={globalCurveConfig.steps} onChange={(e) => setGlobalCurveConfig({ ...globalCurveConfig, steps: Number(e.target.value) })} className="mt-2 w-full" />
                      </label>
                      <label className="block text-[13px] text-muted-foreground">
                        Vibrancy
                        <span className="float-right font-mono text-foreground">{globalCurveConfig.vibrancy}%</span>
                        <input type="range" min={-100} max={100} step={5} value={globalCurveConfig.vibrancy} onChange={(e) => setGlobalCurveConfig({ ...globalCurveConfig, vibrancy: Number(e.target.value) })} className="mt-2 w-full" />
                      </label>
                      <label className="block text-[13px] text-muted-foreground">
                        Contrast
                        <span className="float-right font-mono text-foreground">{globalCurveConfig.contrast}%</span>
                        <input type="range" min={-100} max={100} step={5} value={globalCurveConfig.contrast} onChange={(e) => setGlobalCurveConfig({ ...globalCurveConfig, contrast: Number(e.target.value) })} className="mt-2 w-full" />
                      </label>
                      <label className="block text-[13px] text-muted-foreground">
                        Hue blend
                        <span className="float-right font-mono text-foreground">{globalCurveConfig.hueTorsion}°</span>
                        <input type="range" min={-60} max={60} step={5} value={globalCurveConfig.hueTorsion} onChange={(e) => setGlobalCurveConfig({ ...globalCurveConfig, hueTorsion: Number(e.target.value) })} className="mt-2 w-full" />
                      </label>
                    </div>
                  )}

                  {viewMode === 'gradients' ? (
                    <GradientList colors={activeColors} onCopy={(t) => { navigator.clipboard.writeText(t); showToast('CSS copied'); }} />
                  ) : (
                    <div className={`grid gap-4 ${isCompactView ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
                      {activeColors.map((color, idx) => (
                        <PaletteCard
                          key={`${color.hex}-${idx}`}
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
                            } else if (creationMode === 'manual') {
                              setCustomColors(prev => prev.map((c, i) => i === idx ? updatedColor : c));
                            } else {
                              setPalette(prev => prev.map((c, i) => i === idx ? updatedColor : c));
                            }
                            setIsSaved(false);
                          }}
                          isPrintMode={isPrintMode}
                          isCompact={isCompactView}
                          globalConfig={globalCurveConfig}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
              </>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          <form
            className="shrink-0 border-t border-border bg-sidebar px-4 py-3"
            onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-panel">
                <textarea
                  rows={2}
                  className="max-h-40 min-h-[3.25rem] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="Describe a brand or mood"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  aria-label="Palette prompt"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !chatInput.trim()}
                  className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="size-4" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRefine(0)}
                  disabled={!hasPalette}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[13px] text-foreground hover:bg-accent disabled:opacity-40"
                >
                  <Pipette className="size-3.5" strokeWidth={1.5} />
                  Refine color
                </button>
                <button type="button" onClick={openColors} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Pencil className="size-3.5" strokeWidth={1.5} />
                  Edit colors
                </button>
                <button type="button" onClick={handleTunerClick} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
                  <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
                  Fix palette
                </button>
                <div className="lg:hidden">{renderSkillActions()}</div>
                {!canUseAssistant && (
                  <button type="button" onClick={() => setIsPricingOpen(true)} className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
                    <Sparkles className="size-3.5" strokeWidth={1.5} />
                    Assistant
                  </button>
                )}
              </div>
            </div>
          </form>
        </>
      )}

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
      {paletteToDelete && <ConfirmModal title="Delete Palette?" message="This action cannot be undone." onConfirm={performDelete} onCancel={() => setPaletteToDelete(null)} confirmText="Delete" isDestructive={true} />}
    </div>
  );
};

export default App;
