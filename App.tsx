
import { Plus, Send, Upload } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ColorHSL, ColorData, HarmonyType, ChatMessage, ScaleConfiguration, InputMode, PaletteTab, PlaygroundConfig, GlobalCurveConfig } from './types';
import { generateHarmonies, createColorDataFromHSL, hexToHsl, deduplicateColorNames, generateNeutrals, generateSemantics, createColorData, hslToRgb, rgbToHex } from './utils/colorUtils';
import RefineDrawer from './components/RefineDrawer';
import { generatePaletteFromPrompt } from './services/geminiService';
import ContrastGrid from './components/ContrastGrid';
import PaletteCard from './components/PaletteCard';
import ExportModal from './components/ExportModal';
import PaletteTunerModal from './components/PaletteTunerModal';
import ScaleEditorModal from './components/ScaleEditorModal';
import ColorRowInput from './components/ColorRowInput';
import ImportModal from './components/ImportModal';
import DescribeHeading from './components/DescribeHeading';
import PlaygroundCards from './components/PlaygroundCards';
import GradientList from './components/GradientList';
import { ntc } from './utils/ntc';
// Auth & Storage Imports
import { User } from 'firebase/auth'; 
import { subscribeToAuth, ensureBillingUser } from './services/authService';
import { isDemoMode } from './firebaseConfig';
import { savePaletteToFirestore, getUserPalettes, deletePaletteFromFirestore, SavedPalette } from './services/storageService';
import { captureOwnerAccessFromUrl, clearOwnerAccess, confirmOwnerAccess, hasOwnerFlag, markOwnerUnlocked } from './services/ownerAccess';
import { claimCreditPacks, fetchCreditBalance } from './services/creditClient';
import { formatCompact, type CreditPackId } from './services/credits';
import { getCreditWalletId } from './services/creditWallet';
import { buildStudioColorSkill } from './utils/colorSkill';
import StudioSidebar from './components/StudioSidebar';
import StudioTopBar from './components/StudioTopBar';
import CopilotPanel from './components/CopilotPanel';

// Subscription Imports
import { createCheckoutSession } from './services/subscriptionService';
import PricingModal from './components/PricingModal';
import ConfirmModal from './components/ConfirmModal';

import PaletteLibraryModal from './components/PaletteLibraryModal';

// Legal & Cookies
import CookieConsent from './components/CookieConsent';
import LegalModal, { LegalPageType } from './components/LegalModal';
import { showToast, ToastHost } from './components/Toast';

type MobileTab = 'canvas' | 'editor';
type ViewMode = 'cards' | 'list' | 'ramp' | 'gradients';
type CreationMode = 'generator' | 'manual';

const DEMO_PALETTES: { name: string; colors: [string, string][] }[] = [
  { name: 'Harbor', colors: [['#0E3A46', 'Deep water'], ['#1F7A8C', 'Tide'], ['#BFDBF7', 'Foam'], ['#E36414', 'Buoy']] },
  { name: 'Orchard', colors: [['#1B4332', 'Pine'], ['#40916C', 'Leaf'], ['#D8F3DC', 'Blossom'], ['#F4A261', 'Apricot']] },
  { name: 'Ink', colors: [['#14213D', 'Ink'], ['#415A77', 'Slate'], ['#E0E1DD', 'Paper'], ['#FCA311', 'Signal']] },
  { name: 'Clay', colors: [['#6D2E46', 'Wine'], ['#C05746', 'Clay'], ['#F2E8CF', 'Sand'], ['#2A9D8F', 'Glaze']] },
];

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<CreditPackId | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
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
  const [studioPane, setStudioPane] = useState<'composer' | 'colors'>('composer');
  const [shellOpen, setShellOpen] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinePad, setRefinePad] = useState(false);
  const [refineIndex, setRefineIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [copilotOpen, setCopilotOpen] = useState(false); 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false); 
  const [selectedColorForGrid, setSelectedColorForGrid] = useState<ColorData | null>(null);
  const [selectedColorForEdit, setSelectedColorForEdit] = useState<ColorData | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
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
  const pendingClaim = useRef(false);

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

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchCreditBalance().then((snapshot) => {
      if (cancelled || !snapshot || snapshot.owner || typeof snapshot.balance !== 'number') return;
      setCredits(snapshot.balance);
    });
    return () => { cancelled = true; };
  }, [isOwner]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') pendingClaim.current = true;
    if (!params.get('checkout')) return;
    params.delete('checkout');
    params.delete('pack');
    const qs = params.toString();
    window.history.replaceState({}, document.title, `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (!pendingClaim.current) return;
    let stopped = false;
    let tries = 0;
    const tick = async () => {
      if (stopped || !pendingClaim.current) return;
      let token: string | null = null;
      try {
        token = user ? await user.getIdToken() : null;
      } catch {
        token = null;
      }
      const snapshot = await claimCreditPacks(token);
      if (stopped || !snapshot) return;
      if (!snapshot.owner && typeof snapshot.balance === 'number') setCredits(snapshot.balance);
      if ((snapshot.added ?? 0) > 0 || tries >= 4) {
        pendingClaim.current = false;
        return;
      }
      tries += 1;
      window.setTimeout(tick, 1500);
    };
    void tick();
    return () => { stopped = true; };
  }, [user]);

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
        const neutrals = generateNeutrals(currentHSL);
        setNeutralPalette(neutrals);
        setSemanticPalette(generateSemantics(currentHSL, neutrals));
    } 
    // MANUAL MODE
    else {
        setPalette(customColors);
        if (customColors.length > 0) {
            const neutrals = generateNeutrals(customColors[0].hsl);
            setNeutralPalette(neutrals);
            setSemanticPalette(generateSemantics(customColors[0].hsl, neutrals));
        }
    }

    // Reset saved state when parameters change
    setIsSaved(false);
  }, [baseColor, brightness, harmony, creationMode, customColors]);

  // Reset saved state when name changes
  useEffect(() => {
     setIsSaved(false);
  }, [paletteName]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isChatLoading, studioPane]);

  useEffect(() => {
    if (refineOpen) {
      setRefinePad(true);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRefinePad(false), reduce ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [refineOpen]);

  const goHome = () => {
    setStudioPane('composer');
    setViewMode('cards');
    setShowWork(false);
    setMessages([]);
    setChatInput('');
    setShellOpen(false);
    setCopilotOpen(false);
    setSelectedColorForEdit(null);
    setRefineOpen(false);
  };

  const handleGlobalReset = () => {
    setBaseColor({ h: 215, s: 25, l: 47 }); setBrightness(47); setHarmony('monochromatic'); setPaletteName('Design Tokens');
    setMessages([]); setChatInput('');     setIsPrintMode(false); setActiveTab('brand');
    setViewMode('cards');
    setCreationMode('generator');
    setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    setGlobalCurveConfig({ vibrancy: 0, contrast: 0, hueTorsion: 0, steps: 11 }); // Reset global controls
    setIsSaved(false);
    setStudioPane('composer');
    setShowWork(false);
    setShellOpen(false);
    setRefineOpen(false);
    showToast("Workspace reset successfully");
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
      setShowWork(true);
      setShellOpen(true);
      setStudioPane('composer');
      showToast(`Imported ${colors.length} colors`);
  };

  const handleApplyPalette = (colors: ColorData[]) => {
      const uniqueColors = deduplicateColorNames(colors);
      if (uniqueColors.length > 0) {
          setCreationMode('manual');
          setCustomColors(uniqueColors);
      }
      setActiveTab('brand'); showToast("Palette applied");
      setIsSaved(false);
      if (!showWork) setViewMode('cards');
      setShowWork(true);
      setShellOpen(true);
  };

  const handleChatSubmit = async (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = (preset ?? chatInput).trim();
    if (!text || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text };
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

    if (typeof result.creditsRemaining === 'number') setCredits(result.creditsRemaining);

    if (result.paymentRequired) {
      setIsPricingOpen(true);
      setCopilotOpen(true);
      setMessages(prev => [...prev, { role: 'model', text: result.description || 'Not enough credits.' }]);
      return;
    }

    if (result.colors.length > 0) {
      const uniqueColors = deduplicateColorNames(result.colors); 
      handleApplyPalette(uniqueColors); 
      setPaletteName(result.name);
      setCopilotOpen(true);
      setMessages(prev => [...prev, {
        role: 'model',
        text: result.description || `Updated palette: "${result.name}"`,
        palettePreview: uniqueColors,
        creditsSpent: result.creditsSpent,
      }]);
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
            data['Semantic'] = {};
            semanticPalette.forEach(c => data['Semantic'][c.name] = c.hex);
        }
        return JSON.stringify(data, null, 2);
  };

  // LIMIT CHECK: Edit Scale
  const handleEditClick = (color: ColorData) => {
      setSelectedColorForEdit(color);
  };

  const writeScaleConfig = (colorHex: string, newConfig: ScaleConfiguration | undefined) => {
      const merge = (list: ColorData[]) => list.map(c => c.hex === colorHex ? { ...c, scaleConfig: newConfig } : c);
      if (activeTab === 'neutrals') {
          setNeutralPalette(merge);
      } else if (activeTab === 'system') {
          setSemanticPalette(merge);
      } else if (creationMode === 'manual') {
          setCustomColors(merge);
          setPalette(merge);
      } else {
          setPalette(merge);
      }
      setIsSaved(false);
  };

  const handleScalePreview = (colorHex: string, newConfig: ScaleConfiguration | undefined) => {
      writeScaleConfig(colorHex, newConfig);
  };

  const handleScaleSave = async (colorHex: string, newConfig: ScaleConfiguration) => {
      writeScaleConfig(colorHex, newConfig);
      showToast("Color scale updated");
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

  const handleUpgradeCheckout = async (packId: CreditPackId) => {
      setIsCheckoutLoading(true);
      setCheckoutPack(packId);
      try {
          if (isDemoMode) {
              await createCheckoutSession('demo', packId, getCreditWalletId());
              return;
          }
          const billingUser = user ?? await ensureBillingUser();
          setUser(billingUser);
          await createCheckoutSession(billingUser.uid, packId, getCreditWalletId());
      } catch {
          showToast('Payments are unavailable right now.');
      } finally {
          setIsCheckoutLoading(false);
          setCheckoutPack(null);
      }
  };

  const creditLabel = isOwner ? 'Owner' : credits === null ? 'Credits' : `${formatCompact(credits)} credits`;
  const creditExact = isOwner ? 'Owner' : credits === null ? 'Credits' : `${credits} credits`;
  const renderCreditMeter = () => (
      isOwner ? (
          <span className="text-[13px] text-muted-foreground" title={creditExact}>{creditLabel}</span>
      ) : (
          <button type="button" onClick={() => setIsPricingOpen(true)} className="text-[13px] text-muted-foreground hover:text-foreground" title={creditExact} aria-label={creditExact}>
              {creditLabel}
          </button>
      )
  );

  const activeColors = activeTab === 'neutrals' ? neutralPalette : activeTab === 'system' ? semanticPalette : palette;
  const workingColors = creationMode === 'manual' ? customColors : palette;
  const hasPalette = workingColors.length > 0;
  const showHome = !isChatLoading && messages.length === 0 && !showWork;

  const loadDemo = (demo: typeof DEMO_PALETTES[number]) => {
    handleApplyPalette(demo.colors.map(([hex, name]) => createColorData(hex, undefined, name)));
    setPaletteName(demo.name);
    setViewMode('cards');
    setStudioPane('composer');
  };
  const pendingRequest = [...messages].reverse().find((message) => message.role === 'user')?.text ?? '';

  const openColors = () => {
    if (creationMode === 'generator') {
      const seed = palette.length > 0 ? palette.map((color) => ({ ...color })) : [createColorData('#5A7396', undefined, 'Primary')];
      setCustomColors(seed);
      setCreationMode('manual');
    } else if (customColors.length === 0) {
      setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    }
    setShowWork(true);
    setStudioPane('colors');
  };

  const openRefine = () => {
    const list = creationMode === 'manual' ? customColors : palette;
    if (list.length === 0) return;
    const preferred = creationMode === 'manual' ? playgroundConfig.primaryIndex : 0;
    setRefineIndex(Math.min(Math.max(preferred, 0), list.length - 1));
    setShowWork(true);
    setRefineOpen(true);
  };

  const applyRefineHex = (hex: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return;
    const source = creationMode === 'manual' ? customColors : palette;
    const index = Math.min(Math.max(refineIndex, 0), Math.max(source.length - 1, 0));
    const current = source[index];
    if (!current) return;
    const next = createColorData(hex, current.scaleConfig, current.name);
    if (creationMode === 'manual') {
      setCustomColors(prev => prev.map((color, i) => i === index ? next : color));
    } else if (index === 0) {
      const hsl = hexToHsl(hex);
      setBaseColor(hsl);
      setBrightness(hsl.l);
      if (harmony === 'custom') setHarmony('monochromatic');
    } else {
      setCustomColors(source.map((color, i) => i === index ? next : color));
      setCreationMode('manual');
    }
    setPlaygroundConfig(prev => prev.primaryIndex === index ? prev : { ...prev, primaryIndex: index });
    setIsSaved(false);
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

  const renderPromptForm = () => (
      <form
          className="shrink-0 border-t border-border bg-background px-4 py-3"
          onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
      >
          <div className={`mx-auto flex w-full max-w-3xl flex-col gap-1 ${shellOpen ? '' : 'pl-12 md:pl-0'}`}>
              <div className="px-1">{renderCreditMeter()}</div>
              <div className="flex items-end gap-2">
              <textarea
                  rows={2}
                  className="max-h-40 min-h-[3.25rem] flex-1 resize-none rounded-2xl border border-border bg-card px-3 py-2 text-[15px] text-foreground shadow-panel placeholder:text-muted-foreground focus:outline-none"
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
          </div>
      </form>
  );

  const handlePlaygroundColor = (hex: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) return;
    const source = creationMode === 'manual' ? customColors : palette;
    const index = Math.min(Math.max(playgroundConfig.primaryIndex, 0), Math.max(source.length - 1, 0));
    const current = source[index];
    if (!current) return;
    const next = createColorData(hex, current.scaleConfig, current.name);
    if (creationMode === 'manual') {
      setCustomColors(prev => prev.map((color, i) => i === index ? next : color));
    } else if (index === 0) {
      const hsl = hexToHsl(hex);
      setBaseColor(hsl);
      setBrightness(hsl.l);
      if (harmony === 'custom') setHarmony('monochromatic');
    } else {
      setCustomColors(source.map((color, i) => i === index ? next : color));
      setCreationMode('manual');
    }
    setIsSaved(false);
  };

  const updateListedColor = (tab: PaletteTab, index: number, updatedColor: ColorData) => {
    if (tab === 'neutrals') {
      setNeutralPalette(prev => prev.map((color, i) => i === index ? updatedColor : color));
    } else if (tab === 'system') {
      setSemanticPalette(prev => prev.map((color, i) => i === index ? updatedColor : color));
    } else if (creationMode === 'manual') {
      setCustomColors(prev => prev.map((color, i) => i === index ? updatedColor : color));
    } else {
      setPalette(prev => prev.map((color, i) => i === index ? updatedColor : color));
    }
    setIsSaved(false);
  };

  const showLoader = isChatLoading && !showWork;
  const paletteOpen = showWork && hasPalette && !showHome;

  const viewKey = studioPane !== 'composer'
    ? studioPane
    : showLoader
      ? 'loading'
      : showHome
        ? 'home'
        : 'work';

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-canvas font-sans text-foreground">
      {renderGlobalOverlays()}
      <ToastHost />

      <StudioTopBar
          onHome={goHome}
          onNewPalette={goHome}
          paletteOpen={paletteOpen}
          onSave={handleSavePalette}
          saved={isSaved}
          saving={isSaving}
          refineOpen={refineOpen}
          onRefine={() => { if (refineOpen) setRefineOpen(false); else openRefine(); }}
          onCopySkill={handleCopySkill}
          onDownloadSkill={handleDownloadSkill}
          printOn={isPrintMode}
          onTogglePrint={() => setIsPrintMode((value) => !value)}
          markMotion={isChatLoading ? 'loading' : 'enter'}
      />

      <StudioSidebar
          open={shellOpen}
          onOpenChange={setShellOpen}
          onSavedPalettes={handleOpenLibrary}
      />

      <div className={`flex min-h-0 flex-1 flex-col ${shellOpen ? 'md:pl-[280px]' : ''} ${(selectedColorForEdit || refinePad) ? 'lg:pr-[380px]' : ''}`}>
      <div key={viewKey} className="studio-in flex min-h-0 flex-1 flex-col">
      {studioPane === 'colors' ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-16">
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
      ) : showLoader ? (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div
              className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              {pendingRequest && (
                <p className="max-w-md text-2xl font-medium tracking-tight text-foreground">{pendingRequest}</p>
              )}
              <p className={`text-[15px] text-muted-foreground ${pendingRequest ? 'mt-4' : ''}`}>Making a palette</p>
            </div>
          </div>
          {renderPromptForm()}
        </>
      ) : showHome ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-24 pt-8">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            <DescribeHeading />
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
              The limit is your imagination.
            </p>
            <form className="mt-8" onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-panel">
                <textarea
                  rows={4}
                  className="max-h-48 min-h-[7rem] w-full resize-none bg-transparent px-2 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="A calm brand for a coastal studio"
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
                <div className="flex items-center justify-between">
                  {renderCreditMeter()}
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="size-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-10">
              <p className="mb-3 text-[13px] text-muted-foreground">Try a demo</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {DEMO_PALETTES.filter((demo) => demo.name !== 'Clay').map((demo, index) => (
                  <button
                    key={demo.name}
                    type="button"
                    onClick={() => loadDemo(demo)}
                    className="studio-card w-36 shrink-0 rounded-xl bg-card p-2.5 text-left shadow-panel ring-1 ring-border hover:bg-accent"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <span className="flex h-14 overflow-hidden rounded-lg">
                      {demo.colors.map(([hex]) => (
                        <span key={hex} className="h-full flex-1" style={{ backgroundColor: hex }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-[13px] text-foreground">{demo.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-6">
              {showWork && hasPalette && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Palette view">
                    {([
                      ['cards', 'Cards'],
                      ['list', 'List'],
                      ['ramp', 'Ramp'],
                      ['gradients', 'Gradients'],
                    ] as const).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={viewMode === id}
                        onClick={() => { setStudioPane('composer'); setViewMode(id); }}
                        className={`h-8 rounded-md px-3 text-[13px] ${viewMode === id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {viewMode !== 'cards' && (
                    <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Palette group">
                      {([
                        ['brand', 'Brand'],
                        ['neutrals', 'Neutrals'],
                        ['system', 'Semantic'],
                      ] as const).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={activeTab === id}
                          onClick={() => setActiveTab(id)}
                          className={`h-8 rounded-md px-3 text-[13px] ${activeTab === id ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {showWork && hasPalette && viewMode === 'cards' && (
                <PlaygroundCards
                  brandPalette={workingColors}
                  neutralPalette={neutralPalette}
                  semanticPalette={semanticPalette}
                  config={playgroundConfig}
                  globalConfig={globalCurveConfig}
                  onPrimaryColorChange={handlePlaygroundColor}
                />
              )}

              {showWork && hasPalette && (viewMode === 'list' || viewMode === 'ramp') && (
                <div className={`grid gap-4 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
                  {activeColors.map((color, idx) => (
                    <PaletteCard
                      key={`${color.hex}-${idx}`}
                      color={color}
                      onOpenGrid={setSelectedColorForGrid}
                      onEditScale={handleEditClick}
                      onCopy={(hex) => { navigator.clipboard.writeText(hex); showToast(`Copied ${hex}`); }}
                      onColorUpdate={(updatedColor) => updateListedColor(activeTab, idx, updatedColor)}
                      isPrintMode={isPrintMode}
                      isCompact={viewMode === 'list'}
                      globalConfig={globalCurveConfig}
                    />
                  ))}
                </div>
              )}

              {showWork && hasPalette && viewMode === 'gradients' && (
                <GradientList colors={activeColors} onCopy={(t) => { navigator.clipboard.writeText(t); showToast('CSS copied'); }} />
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </>
      )}
      </div>
      </div>

      {workingColors.length > 0 && (
        <RefineDrawer
          open={refineOpen}
          color={workingColors[Math.min(refineIndex, workingColors.length - 1)]}
          globalConfig={globalCurveConfig}
          siblings={creationMode === 'manual' ? customColors : undefined}
          colorIndex={Math.min(refineIndex, Math.max(workingColors.length - 1, 0))}
          onSelectColor={(index) => {
            setRefineIndex(index);
            setPlaygroundConfig((prev) => ({ ...prev, primaryIndex: index }));
          }}
          onClose={() => setRefineOpen(false)}
          onChange={applyRefineHex}
        />
      )}

      {paletteOpen && (
        <CopilotPanel
          open={copilotOpen}
          onToggle={() => setCopilotOpen((value) => !value)}
          onClose={() => setCopilotOpen(false)}
          messages={messages}
          input={chatInput}
          onInput={setChatInput}
          onSubmit={(text) => { void handleChatSubmit(undefined, text); }}
          loading={isChatLoading}
          balanceLabel={creditLabel}
          balanceTitle={creditExact}
          onCredits={isOwner ? undefined : () => setIsPricingOpen(true)}
        />
      )}

      {/* Modals */}
      {selectedColorForEdit && (
          <ScaleEditorModal
              color={selectedColorForEdit}
              onClose={() => setSelectedColorForEdit(null)}
              onSave={handleScaleSave}
              onPreview={handleScalePreview}
              isPremium
          />
      )}
      {isExportOpen && <ExportModal brandPalette={palette} neutralPalette={neutralPalette} semanticPalette={semanticPalette} paletteName={paletteName} globalConfig={globalCurveConfig} onClose={() => setIsExportOpen(false)} />}
      {isTunerOpen && <PaletteTunerModal onClose={() => setIsTunerOpen(false)} isPremium initialCode={getTunerCode()} />}
      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} onImport={handleImport} limit={200} isPremium />}
      {isLibraryOpen && <PaletteLibraryModal palettes={savedPalettes} isLoading={isLibraryLoading} onClose={() => setIsLibraryOpen(false)} onLoadPalette={handleLoadPalette} onDeletePalette={handleDeleteRequest} isPremium />}
      {isPricingOpen && <PricingModal onClose={() => setIsPricingOpen(false)} onCheckout={handleUpgradeCheckout} isLoading={isCheckoutLoading} loadingPack={checkoutPack} limitType="ai" />}
      {selectedColorForGrid && <ContrastGrid color={selectedColorForGrid} onClose={() => setSelectedColorForGrid(null)} />}
      {paletteToDelete && <ConfirmModal title="Delete Palette?" message="This action cannot be undone." onConfirm={performDelete} onCancel={() => setPaletteToDelete(null)} confirmText="Delete" isDestructive={true} />}
    </div>
  );
};

export default App;
