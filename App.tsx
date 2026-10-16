
import { motion } from 'motion/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowUp, Check, ChevronDown, Heart, Plus, Upload } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MotionButton, enterMotion, fadeEnter, useReduced } from './components/uiMotion';
import { Hint } from './components/Hint';
import { ColorHSL, ColorData, HarmonyType, ChatMessage, ScaleConfiguration, InputMode, PaletteTab, PlaygroundConfig, GlobalCurveConfig } from './types';
import { generateHarmonies, createColorDataFromHSL, hexToHsl, deduplicateColorNames, generateNeutrals, generateSemantics, createColorData, hslToRgb, rgbToHex, collectPaletteColors, colorsFromPaletteText } from './utils/colorUtils';
import RefineDrawer from './components/RefineDrawer';
import BuildPalette from './components/BuildPalette';
import { hexFromOklch } from './components/OklchControls';
import { generatePaletteFromPrompt } from './services/geminiService';
import ContrastGrid from './components/ContrastGrid';
import PaletteCard from './components/PaletteCard';
import ExportModal from './components/ExportModal';
import PaletteTunerModal from './components/PaletteTunerModal';
import ScaleEditorModal from './components/ScaleEditorModal';
import ColorRowInput from './components/ColorRowInput';
import ImportModal from './components/ImportModal';
import ComposerAttach from './components/ComposerAttach';
import DescribeHeading from './components/DescribeHeading';
import LogoMark from './components/LogoMark';
import GradientList from './components/GradientList';
import { ntc } from './utils/ntc';
// Auth & Storage Imports
import { User } from 'firebase/auth'; 
import { subscribeToAuth, loginUser, loginWithGoogle, logoutUser, registerUser } from './services/authService';
import { isDemoMode } from './firebaseConfig';
import {
  deletePaletteFromFirestore,
  getUserPalettes,
  MAX_SAVED_PALETTES,
  PaletteLimitError,
  renamePaletteInFirestore,
  savePaletteToFirestore,
  SavedPalette,
} from './services/storageService';
import { claimCreditPacks, fetchCreditBalance, type CreditAllowance, type CreditSnapshot } from './services/creditClient';
import { creditStatusCopy, identityFromAccount, isUnlimitedAccount } from './utils/accountMenu';
import { type CreditPackId } from './services/credits';
import { getCreditWalletId } from './services/creditWallet';
import { buildStudioColorSkill } from './utils/colorSkill';
import StudioSidebar from './components/StudioSidebar';
import StudioTopBar from './components/StudioTopBar';
import AccountMenu from './components/AccountMenu';
import CopilotPanel from './components/CopilotPanel';
import Playground, { PlaygroundHandle } from './components/playground/Playground';
import DotGrid from './components/DotGrid';

// Subscription Imports
import { createCheckoutSession } from './services/subscriptionService';
import PricingModal from './components/PricingModal';
import ConfirmModal from './components/ConfirmModal';

import PaletteLibraryModal from './components/PaletteLibraryModal';
import PaletteNameEditor from './components/PaletteNameEditor';
import { renameSavedPaletteList } from './utils/paletteName';

// Legal & Cookies
import CookieConsent from './components/CookieConsent';
import LegalModal, { LegalPageType } from './components/LegalModal';
import { showToast, ToastHost } from './components/Toast';

type MobileTab = 'canvas' | 'editor';
type ViewMode = 'list' | 'ramp' | 'gradients';
const PALETTE_TABS = [
  ['brand', 'Brand'],
  ['neutrals', 'Neutrals'],
  ['system', 'Semantic'],
] as const;
type PreviewMode = 'palette' | 'components';
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
  const [profileTick, setProfileTick] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutPack, setCheckoutPack] = useState<CreditPackId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [allowance, setAllowance] = useState<CreditAllowance>('unknown');
  const [accountPrompt, setAccountPrompt] = useState({ signal: 0, mode: 'signin' as 'signin' | 'signup' });
  const buyAfterAuth = useRef(false);
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
  const [studioPane, setStudioPane] = useState<'composer' | 'colors' | 'playground'>('composer');
  const [shellOpen, setShellOpen] = useState(false);
  const [showWork, setShowWork] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refinePad, setRefinePad] = useState(false);
  const [refineIndex, setRefineIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('ramp');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('palette');
  const [route, setRoute] = useState<'home' | 'build'>(() => (window.location.pathname === '/build' ? 'build' : 'home'));
  const navigate = (next: 'home' | 'build') => {
    const path = next === 'build' ? '/build' : '/';
    if (window.location.pathname !== path) window.history.pushState(null, '', path);
    setRoute(next);
  };
  useEffect(() => {
    if (route === 'build' && (creationMode !== 'manual' || customColors.length === 0)) seedBuild();
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname === '/build' ? 'build' : 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const showPaletteView = (mode?: ViewMode) => {
    setStudioPane('composer');
    setPreviewMode('palette');
    if (mode) setViewMode(mode);
  };
  const [copilotOpen, setCopilotOpen] = useState(false); 
  const [fabAttention, setFabAttention] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  // Pigmento's second job inside the Playground: building cards from a sentence.
  const playgroundRef = useRef<PlaygroundHandle>(null);
  const [pigmentoMode, setPigmentoMode] = useState<'palette' | 'card'>('palette');
  const [cardMessages, setCardMessages] = useState<ChatMessage[]>([]);
  const [cardChatInput, setCardChatInput] = useState('');
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [generatingName, setGeneratingName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false); 
  const [selectedColorForGrid, setSelectedColorForGrid] = useState<ColorData | null>(null);
  const [selectedColorForEdit, setSelectedColorForEdit] = useState<ColorData | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importImage, setImportImage] = useState<File | null>(null);
  
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
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  // Legal Modal State
  const [legalModalType, setLegalModalType] = useState<LegalPageType | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const workScrollRef = useRef<HTMLDivElement>(null);
  const paletteTitleRef = useRef<HTMLDivElement>(null);
  const prevWorkLandedRef = useRef(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const pendingClaim = useRef(false);
  const paletteOwnerId = user && !user.isAnonymous ? user.uid : 'local';

  // Only one drawer at a time: opening Pigmento, Refine color or the scale
  // editor closes the others, each with its own exit motion.
  useEffect(() => {
    if (!copilotOpen) return;
    setRefineOpen(false);
    setSelectedColorForEdit(null);
  }, [copilotOpen]);
  useEffect(() => {
    if (!refineOpen) return;
    setCopilotOpen(false);
    setSelectedColorForEdit(null);
  }, [refineOpen]);
  const editingColor = selectedColorForEdit !== null;
  useEffect(() => {
    if (!editingColor) return;
    setCopilotOpen(false);
    setRefineOpen(false);
  }, [editingColor]);

  // Initialize Custom Colors with default
  useEffect(() => {
     // /build seeds its own first color.
     if (customColors.length === 0 && window.location.pathname !== '/build') {
         setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
     }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || user.displayName) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      setProfileTick((tick) => tick + 1);
      if (user.displayName || tries >= 6) window.clearInterval(timer);
    }, 200);
    return () => window.clearInterval(timer);
  }, [user]);

  const applyCreditSnapshot = (snapshot: CreditSnapshot) => {
    const emailOwner = Boolean(user && !user.isAnonymous && isUnlimitedAccount(identityFromAccount(user).email));
    const owner = snapshot.owner === true || emailOwner;
    setIsOwner(owner);
    if (owner) return;
    if (typeof snapshot.balance === 'number') setCredits(snapshot.balance);
    setAllowance(snapshot.allowance);
  };

  const askAccount = (mode: 'signin' | 'signup') => {
    setAccountPrompt((prev) => ({ signal: prev.signal + 1, mode }));
  };

  useEffect(() => {
    if (previewMode === 'components') setPreviewMode('palette');
  }, [previewMode]);

  useEffect(() => {
    if (!buyAfterAuth.current || !user || user.isAnonymous) return;
    buyAfterAuth.current = false;
    setIsPricingOpen(true);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setActiveSavedId(null);
    getUserPalettes(paletteOwnerId)
      .then((palettes) => {
        if (!cancelled) setSavedPalettes(palettes);
      })
      .catch(() => {
        if (!cancelled) {
          setSavedPalettes([]);
          showToast('Could not load saved palettes.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [paletteOwnerId]);

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      let token: string | null = null;
      try {
        token = user ? await user.getIdToken() : null;
      } catch {
        token = null;
      }
      const snapshot = await fetchCreditBalance(token);
      if (cancelled || !snapshot) return;
      applyCreditSnapshot(snapshot);
    };
    void sync();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') pendingClaim.current = true;
    if (!params.has('checkout') && !params.has('pack') && !params.has('access')) return;
    params.delete('checkout');
    params.delete('pack');
    params.delete('access');
    const qs = params.toString();
    window.history.replaceState({}, document.title, `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, []);

  useEffect(() => {
    if (!pendingClaim.current) return;
    let stopped = false;
    let tries = 0;
    let baseline: number | undefined;
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
      applyCreditSnapshot(snapshot);
      if (!snapshot.owner && typeof snapshot.balance === 'number') {
        if (baseline === undefined) baseline = snapshot.balance;
        else if (snapshot.balance > baseline) {
          pendingClaim.current = false;
          return;
        }
      }
      if (tries >= 8) {
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

  // A fresh home generation lands on the palette title. The old chat-end
  // scroll pushed the work view to the bottom, so it is gone.
  const landedWork = showWork && (creationMode === 'manual' ? customColors.length > 0 : palette.length > 0);
  useEffect(() => {
    const justLanded = landedWork && !prevWorkLandedRef.current;
    prevWorkLandedRef.current = landedWork;
    if (!justLanded) return;
    const frame = window.requestAnimationFrame(() => {
      workScrollRef.current?.scrollTo({ top: 0 });
      paletteTitleRef.current?.scrollIntoView({ block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [landedWork]);

  useEffect(() => {
    if (refineOpen) {
      setRefinePad(true);
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setRefinePad(false), reduce ? 0 : 180);
    return () => window.clearTimeout(timer);
  }, [refineOpen]);

  useEffect(() => {
    if (!isChatLoading && messages.length === 0 && !showWork) {
      setShellOpen(false);
    }
  }, [isChatLoading, messages.length, showWork]);

  const goHome = () => {
    navigate('home');
    setStudioPane('composer');
    setViewMode('ramp');
    setPreviewMode('palette');
    setShowWork(false);
    setMessages([]);
    setChatInput('');
    setShellOpen(false);
    setActiveSavedId(null);
    setCopilotOpen(false);
    setSelectedColorForEdit(null);
    setSelectedColorForGrid(null);
    setRefineOpen(false);
  };

  const seedBuild = () => {
    const seed = hexFromOklch(0.55, 0.12, Math.random() * 360);
    setCreationMode('manual');
    setCustomColors([createColorData(seed)]);
    setActiveSavedId(null);
    setIsSaved(false);
  };

  const openBuild = () => {
    seedBuild();
    setStudioPane('composer');
    setShellOpen(false);
    setRefineOpen(false);
    setSelectedColorForGrid(null);
    navigate('build');
  };

  const openBuildInStudio = () => {
    navigate('home');
    setStudioPane('composer');
    setPreviewMode('palette');
    setViewMode('ramp');
    setActiveTab('brand');
    setShowWork(true);
    openPaletteShell();
  };

  const handleGlobalReset = () => {
    setBaseColor({ h: 215, s: 25, l: 47 }); setBrightness(47); setHarmony('monochromatic'); setPaletteName('Design Tokens');
    setMessages([]); setChatInput('');     setIsPrintMode(false); setActiveTab('brand');
    setViewMode('ramp');
    setPreviewMode('palette');
    setCreationMode('generator');
    setCustomColors([createColorData('#5A7396', undefined, 'Primary')]);
    setGlobalCurveConfig({ vibrancy: 0, contrast: 0, hueTorsion: 0, steps: 11 }); // Reset global controls
    setIsSaved(false);
    setStudioPane('composer');
    setShowWork(false);
    setShellOpen(false);
    setActiveSavedId(null);
    setRefineOpen(false);
    setSelectedColorForGrid(null);
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

  const addColorToOpenPalette = () => {
      const source = activeTab === 'neutrals'
        ? neutralPalette
        : activeTab === 'system'
          ? semanticPalette
          : (creationMode === 'manual' ? customColors : palette);
      const brand = creationMode === 'manual' ? customColors : palette;
      const seed = source[source.length - 1] ?? brand[brand.length - 1];
      if (!seed) return;
      const next = createColorDataFromHSL((seed.hsl.h + 30) % 360, seed.hsl.s, seed.hsl.l);
      const added = deduplicateColorNames([...source, next]);
      if (activeTab === 'neutrals') {
        setNeutralPalette(added);
      } else if (activeTab === 'system') {
        setSemanticPalette(added);
      } else {
        setCustomColors(added);
        setPalette(added);
        setCreationMode('manual');
      }
      setIsSaved(false);
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

  // Tools dock from the md breakpoint. On a phone the shell stays closed until the toggle.
  const openPaletteShell = () => {
      if (window.matchMedia('(min-width: 768px)').matches) setShellOpen(true);
  };

  const handleImport = (colors: ColorData[]) => {
      setCustomColors(colors);
      setCreationMode('manual');
      setIsImportOpen(false);
      setImportImage(null);
      setShowWork(true);
      openPaletteShell();
      setActiveSavedId(null);
      setSelectedColorForGrid(null);
      setStudioPane('composer');
      showToast(`Imported ${colors.length} colors`);
  };

  const startFromPicture = (file: File) => {
      setImportImage(file);
      setIsImportOpen(true);
  };

  const startFromColorFile = (text: string) => {
      const colors = collectPaletteColors(text);
      if (colors.length === 0) {
          showToast('No colors found in that file.');
          return;
      }
      handleImport(colors);
  };

  const submitHomeComposer = () => {
      const colors = colorsFromPaletteText(chatInput);
      if (colors.length > 0) {
          setChatInput('');
          handleImport(colors);
          return;
      }
      void handleChatSubmit();
  };

  const pasteHomeComposer = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const colors = colorsFromPaletteText(event.clipboardData.getData('text'));
      if (colors.length === 0) return;
      event.preventDefault();
      setChatInput('');
      handleImport(colors);
  };

  const handleApplyPalette = (colors: ColorData[]) => {
      const uniqueColors = deduplicateColorNames(colors);
      if (uniqueColors.length > 0) {
          setCreationMode('manual');
          setCustomColors(uniqueColors);
      }
      setActiveTab('brand'); showToast("Palette applied");
      setIsSaved(false);
      if (!showWork) setViewMode('ramp');
      setShowWork(true);
      if (route !== 'build') openPaletteShell();
      setActiveSavedId(null);
      setSelectedColorForGrid(null);
  };

  const handleCardSubmit = async (preset?: string) => {
    const prompt = (preset ?? cardChatInput).trim();
    if (!prompt || isCardLoading || !playgroundRef.current) return;
    setCardChatInput('');
    setCardMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setIsCardLoading(true);
    const outcome = await playgroundRef.current.createCard(prompt);
    setIsCardLoading(false);
    setCardMessages(prev => [...prev, { role: 'model', text: outcome.message, creditsSpent: outcome.creditsSpent }]);
    if (outcome.paymentRequired) {
      if (user && !user.isAnonymous) setIsPricingOpen(true);
      else {
        buyAfterAuth.current = true;
        askAccount('signup');
      }
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent, preset?: string) => {
    if (e) e.preventDefault();
    const text = (preset ?? chatInput).trim();
    if (!text || isChatLoading) return;

    const userMsg: ChatMessage = { role: 'user', text };
    const fromHome = route !== 'build' && !showWork && messages.length === 0;
    setGeneratingName(text);
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
      setCopilotOpen(true);
      setMessages(prev => [...prev, { role: 'model', text: result.description || 'Not enough credits.' }]);
      if (user && !user.isAnonymous) setIsPricingOpen(true);
      else {
        buyAfterAuth.current = true;
        askAccount('signup');
      }
      return;
    }

    if (result.colors.length > 0) {
      const uniqueColors = deduplicateColorNames(result.colors); 
      handleApplyPalette(uniqueColors); 
      setPaletteName(result.name);
      // A home generation lands cleanly: title in view, tools closed on
      // phones (openPaletteShell keeps desktop behavior), assistant panel
      // closed with the FAB bouncing for attention. Follow-up edits from
      // the open panel keep their current behavior.
      if (fromHome) {
        setCopilotOpen(false);
        setFabAttention((value) => value + 1);
      }
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

  // --- Storage Handlers ---
  const handleSavePalette = async (nameOverride?: string): Promise<boolean> => {
      const name = nameOverride ?? paletteName;
      if (nameOverride) setPaletteName(nameOverride);
      setIsSaving(true);
      let ok = false;
      try {
          const colorsToSave = creationMode === 'manual' ? customColors : palette;
          const newId = await savePaletteToFirestore(paletteOwnerId, name, colorsToSave);
          
          setIsSaved(true);
          
          const newPaletteEntry: SavedPalette = {
             id: newId,
             userId: paletteOwnerId,
             name,
             colors: colorsToSave,
             createdAt: { seconds: Date.now() / 1000 } 
          };
          setSavedPalettes(prev => [newPaletteEntry, ...prev]);
          setActiveSavedId(newId);
          if (route !== 'build') setShellOpen(true);
          showToast(paletteOwnerId === 'local' ? 'Saved on this browser' : 'Saved to your account');
          ok = true;
      } catch (error) {
          if (error instanceof PaletteLimitError) {
            setIsLibraryOpen(true);
            showToast(`You have ${MAX_SAVED_PALETTES} saved palettes. Delete one before saving another.`);
          } else {
            showToast("Failed to save palette.");
          }
      }
      setIsSaving(false);
      return ok;
  };

  const handleOpenLibrary = async () => {
      setIsLibraryOpen(true);
      setIsLibraryLoading(true);
      try {
        const data = await getUserPalettes(paletteOwnerId);
        setSavedPalettes(data);
      } catch {
        showToast('Could not load saved palettes.');
      } finally {
        setIsLibraryLoading(false);
      }
  };

  const handleLoadPalette = (p: SavedPalette) => {
      handleApplyPalette(p.colors);
      setPaletteName(p.name);
      setIsLibraryOpen(false);
      setIsSaved(true);
      setActiveSavedId(p.id);
      showToast(`Loaded "${p.name}"`);
  };

  const renameOpenPalette = (name: string) => {
      setPaletteName(name);
      if (!activeSavedId) return;
      setSavedPalettes((prev) => renameSavedPaletteList(prev, activeSavedId, name));
      void renamePaletteInFirestore(paletteOwnerId, activeSavedId, name);
  };

  const renameLibraryPalette = (id: string, name: string) => {
      setSavedPalettes((prev) => renameSavedPaletteList(prev, id, name));
      void renamePaletteInFirestore(paletteOwnerId, id, name);
      if (activeSavedId === id) setPaletteName(name);
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
      setActiveSavedId((current) => (current === id ? null : current));
      
      try {
        await deletePaletteFromFirestore(paletteOwnerId, id);
        showToast("Palette deleted");
      } catch (e) {
        console.error(e);
        const palettes = await getUserPalettes(paletteOwnerId);
        setSavedPalettes(palettes);
        showToast("Error deleting palette");
      }
  };

  const handleUpgradeCheckout = async (packId: CreditPackId) => {
      if (!user || user.isAnonymous) {
          buyAfterAuth.current = true;
          askAccount('signup');
          setIsPricingOpen(false);
          return;
      }
      setIsCheckoutLoading(true);
      setCheckoutPack(packId);
      setCheckoutError(null);
      showToast('Opening secure checkout…');
      try {
          if (isDemoMode) {
              await createCheckoutSession('demo', packId, getCreditWalletId());
              return;
          }
          const token = await user.getIdToken();
          await fetchCreditBalance(token);
          await createCheckoutSession(user.uid, packId, getCreditWalletId());
      } catch (error) {
          const message = error instanceof Error && error.message ? error.message : 'Payments are unavailable right now.';
          setCheckoutError(message);
          showToast(message);
      } finally {
          setIsCheckoutLoading(false);
          setCheckoutPack(null);
      }
  };

  const studioSignedIn = Boolean(user && !user.isAnonymous);
  const ownerView = isOwner || (studioSignedIn && isUnlimitedAccount(identityFromAccount(user).email));
  const creditCopy = creditStatusCopy({
    balance: credits,
    allowance,
    signedIn: studioSignedIn,
    unlimited: ownerView,
  });
  const openCredits = () => {
    if (ownerView) return;
    if (studioSignedIn) setIsPricingOpen(true);
    else askAccount('signin');
  };
  const renderCreditMeter = () => (
      ownerView ? null : (
          <button type="button" onClick={openCredits} className="text-[13px] text-muted-foreground hover:text-foreground" title={creditCopy.detail} aria-label={creditCopy.detail}>
              {creditCopy.meter}
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
    setViewMode('ramp');
    setPreviewMode('palette');
    setStudioPane('composer');
  };
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

  const accountIdentity = useMemo(() => identityFromAccount(user), [user, profileTick]);
  const reduce = useReduced();
  const showLoader = isChatLoading && !showWork;
  const inBuild = route === 'build';
  const paletteOpen = showWork && hasPalette && !showHome && !inBuild;
  const buildName = paletteName && paletteName !== 'Design Tokens' ? paletteName : `${customColors[0]?.name ?? 'My'} palette`;

  const inPlayground = studioPane === 'playground' && !inBuild && !selectedColorForGrid;
  const cardMode = inPlayground && pigmentoMode === 'card';

  const viewKey = inBuild
    ? 'build'
    : selectedColorForGrid
    ? 'contrast'
    : studioPane !== 'composer'
      ? studioPane
      : showLoader
        ? 'loading'
        : showHome
          ? 'home'
          : 'work';

  return (
    <div className="relative isolate flex h-[100dvh] flex-col overflow-hidden bg-canvas font-sans text-foreground">
      <DotGrid />
      {renderGlobalOverlays()}
      <ToastHost />

      <StudioTopBar
          onHome={goHome}
          markMotion="enter"
      />
      <AccountMenu
          email={accountIdentity.email}
          name={accountIdentity.name}
          accountId={user && !user.isAnonymous ? user.uid : null}
          signedIn={studioSignedIn}
          ownerSession={ownerView}
          balance={credits}
          allowance={allowance}
          openSignal={accountPrompt.signal}
          openMode={accountPrompt.mode}
          onLogout={async () => {
            await logoutUser();
            setUser(null);
            setIsOwner(false);
          }}
          onBuyMore={() => setIsPricingOpen(true)}
          onSignIn={loginUser}
          onSignUp={(email, password) => registerUser(email, password, email.split('@')[0])}
          onGoogle={loginWithGoogle}
      />

      {!isPricingOpen && (
        <StudioSidebar
          open={shellOpen}
          onOpenChange={setShellOpen}
          onSavedPalettes={handleOpenLibrary}
          onNewPalette={goHome}
          paletteOpen={paletteOpen}
          refineOpen={refineOpen}
          onRefine={() => { if (refineOpen) setRefineOpen(false); else openRefine(); }}
          onExportMarkdown={handleDownloadSkill}
          playgroundOpen={studioPane === 'playground'}
          onPlayground={() => setStudioPane((pane) => (pane === 'playground' ? 'composer' : 'playground'))}
          curve={globalCurveConfig}
          onCurve={setGlobalCurveConfig}
        />
      )}

      <div className={`flex min-h-0 flex-1 flex-col pt-14 ${(selectedColorForEdit || refinePad) ? 'lg:pr-[400px]' : ''}`}>
      <motion.div key={viewKey} className="flex min-h-0 flex-1 flex-col" {...fadeEnter(reduce)}>
      {inBuild ? (
        <BuildPalette
          colors={customColors}
          onColorsChange={(next) => { setCustomColors(next); setActiveSavedId(null); }}
          globalConfig={globalCurveConfig}
          suggestedName={buildName}
          saving={isSaving}
          saved={isSaved}
          onSave={(name) => handleSavePalette(name)}
          onOpenStudio={openBuildInStudio}
          onBack={() => navigate('home')}
          onAskPigmento={() => setCopilotOpen(true)}
          pigmentoBusy={isChatLoading}
        />
      ) : selectedColorForGrid ? (
        <ContrastGrid color={selectedColorForGrid} globalConfig={globalCurveConfig} onClose={() => setSelectedColorForGrid(null)} />
      ) : studioPane === 'playground' ? (
        <Playground
          brandPalette={workingColors}
          neutralPalette={neutralPalette}
          semanticPalette={semanticPalette}
          config={playgroundConfig}
          onConfigChange={setPlaygroundConfig}
          globalConfig={globalCurveConfig}
          userId={paletteOwnerId}
          onCreditsChange={setCredits}
          ref={playgroundRef}
          onCreateWithPigmento={() => { setPigmentoMode('card'); setCopilotOpen(true); }}
          insetLeft={shellOpen}
          insetRight={copilotOpen}
        />
      ) : studioPane === 'colors' ? (
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
              <MotionButton type="button" onClick={handleAddCustomColor} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card text-[13px] text-foreground hover:bg-accent">
                <Plus className="size-4" strokeWidth={1.5} />
                Add color
              </MotionButton>
              <MotionButton type="button" onClick={() => setIsImportOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground hover:bg-accent">
                <Upload className="size-4" strokeWidth={1.5} />
                Import
              </MotionButton>
            </div>
          </div>
        </div>
      ) : showLoader ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div
            className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center bg-transparent px-4 py-16"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label={generatingName ? `Generating ${generatingName}` : 'Generating palette'}
          >
            <div className="flex w-full max-w-3xl items-center justify-center gap-3">
              <LogoMark motion="loading" className="block size-[46px] max-h-[46px] max-w-[46px] shrink-0 bg-transparent text-foreground" />
              <h1 className="min-w-0 truncate text-3xl font-medium tracking-tight text-foreground">{generatingName}</h1>
            </div>
          </div>
        </div>
      ) : showHome ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-24 pt-8">
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-8">
            <DescribeHeading />
            <p className="mx-auto mt-3 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
              The limit is your imagination.
            </p>
            {!ownerView && (
              <p className="mx-auto mt-3 max-w-md text-center text-[13px] leading-relaxed text-muted-foreground">
                {creditCopy.detail}
              </p>
            )}
            <motion.form className="mt-8" onSubmit={(e) => { e.preventDefault(); submitHomeComposer(); }} {...enterMotion(reduce)}>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-panel">
                <textarea
                  rows={4}
                  className="max-h-48 min-h-[7rem] w-full resize-none bg-transparent px-2 py-2 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  placeholder="A calm brand for a coastal studio"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onPaste={pasteHomeComposer}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitHomeComposer();
                    }
                  }}
                  aria-label="Palette prompt"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ComposerAttach
                      onPicture={startFromPicture}
                      onColorFile={startFromColorFile}
                      onColorFileError={() => showToast('Could not read that file.')}
                    />
                    {renderCreditMeter()}
                  </div>
                  <MotionButton
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <ArrowUp className="size-4" strokeWidth={1.5} />
                  </MotionButton>
                </div>
              </div>
            </motion.form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={openBuild}
                className="text-[13px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                or build your palette manually →
              </button>
            </div>
            <div className="mt-8">
              <p className="mb-3 text-[13px] text-muted-foreground">Try a demo</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {DEMO_PALETTES.filter((demo) => demo.name !== 'Clay').map((demo, index) => (
                  <MotionButton
                    key={demo.name}
                    type="button"
                    onClick={() => loadDemo(demo)}
                    className="w-36 shrink-0 rounded-xl bg-card p-2.5 text-left ring-1 ring-border hover:bg-accent"
                    {...enterMotion(reduce, index)}
                  >
                    <span className="flex h-14 overflow-hidden rounded-lg">
                      {demo.colors.map(([hex]) => (
                        <span key={hex} className="h-full flex-1" style={{ backgroundColor: hex }} />
                      ))}
                    </span>
                    <span className="mt-2 block text-[13px] text-foreground">{demo.name}</span>
                  </MotionButton>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div ref={workScrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-6">
              {showWork && hasPalette && (
                <div ref={paletteTitleRef} className="scroll-mt-6">
                <PaletteNameEditor
                  name={paletteName}
                  onSave={renameOpenPalette}
                  className="text-xl font-medium tracking-tight text-foreground"
                />
                </div>
              )}
              {showWork && hasPalette && (
                <div className="flex w-full flex-nowrap items-center gap-1 rounded-lg border border-border bg-card p-0.5" role="toolbar" aria-label="Palette view controls">
                  <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto" role="group" aria-label="Palette view">
                    <div className={`flex h-8 shrink-0 items-stretch rounded-md ${previewMode === 'palette' ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                      <MotionButton
                        type="button"
                        aria-pressed={previewMode === 'palette'}
                        onClick={() => showPaletteView()}
                        transition={{ duration: 0 }}
                        className={`whitespace-nowrap rounded-l-md pl-3 pr-2 text-[13px] ${previewMode === 'palette' ? '' : 'hover:bg-accent'}`}
                      >
                        Palette
                      </MotionButton>
                      <span aria-hidden className="my-2 w-px bg-current opacity-25" />
                      <DropdownMenu.Root>
                        <Hint label="View options">
                          <DropdownMenu.Trigger asChild>
                            <MotionButton
                              type="button"
                              aria-label="View options"
                              transition={{ duration: 0 }}
                              className={`grid w-7 place-items-center rounded-r-md ${previewMode === 'palette' ? '' : 'hover:bg-accent'}`}
                            >
                              <ChevronDown className="size-3.5" strokeWidth={1.5} aria-hidden />
                            </MotionButton>
                          </DropdownMenu.Trigger>
                        </Hint>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            align="start"
                            sideOffset={6}
                            collisionPadding={8}
                            className="z-50 min-w-44 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
                          >
                            <DropdownMenu.RadioGroup
                              value={previewMode === 'palette' ? viewMode : ''}
                              onValueChange={(value) => showPaletteView(value as ViewMode)}
                            >
                              {([
                                ['ramp', 'Show as cards'],
                                ['list', 'Show as list'],
                                ['gradients', 'Show gradients'],
                              ] as const).map(([id, label]) => (
                                <DropdownMenu.RadioItem
                                  key={id}
                                  value={id}
                                  className="flex h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-[13px] text-foreground outline-none data-[highlighted]:bg-accent"
                                >
                                  <span className="grid size-4 place-items-center">
                                    <DropdownMenu.ItemIndicator>
                                      <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
                                    </DropdownMenu.ItemIndicator>
                                  </span>
                                  {label}
                                </DropdownMenu.RadioItem>
                              ))}
                            </DropdownMenu.RadioGroup>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                    <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0" style={{ backgroundColor: 'var(--border)' }} />
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <MotionButton
                          type="button"
                          aria-label={`Color set: ${PALETTE_TABS.find(([id]) => id === activeTab)?.[1]}`}
                          transition={{ duration: 0 }}
                          className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md pl-3 pr-2 text-[13px] text-foreground hover:bg-accent data-[state=open]:bg-accent"
                        >
                          {PALETTE_TABS.find(([id]) => id === activeTab)?.[1]}
                          <ChevronDown className="size-3.5" strokeWidth={1.5} aria-hidden />
                        </MotionButton>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="start"
                          sideOffset={6}
                          collisionPadding={8}
                          className="z-50 min-w-40 rounded-xl bg-card p-1 shadow-panel ring-1 ring-border"
                        >
                          <DropdownMenu.RadioGroup value={activeTab} onValueChange={(value) => setActiveTab(value as PaletteTab)}>
                            {PALETTE_TABS.map(([id, label]) => (
                              <DropdownMenu.RadioItem
                                key={id}
                                value={id}
                                className="flex h-9 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-[13px] text-foreground outline-none data-[highlighted]:bg-accent"
                              >
                                <span className="grid size-4 place-items-center">
                                  <DropdownMenu.ItemIndicator>
                                    <Check className="size-3.5" strokeWidth={1.5} aria-hidden />
                                  </DropdownMenu.ItemIndicator>
                                </span>
                                {label}
                              </DropdownMenu.RadioItem>
                            ))}
                          </DropdownMenu.RadioGroup>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Hint label="Add a color">
                      <MotionButton
                        type="button"
                        onClick={addColorToOpenPalette}
                        aria-label="Add a color"
                        transition={{ duration: 0 }}
                        className="grid size-8 shrink-0 place-items-center rounded-md text-foreground hover:bg-accent"
                      >
                        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
                      </MotionButton>
                    </Hint>
                    <Hint label={isSaved ? 'Saved' : 'Save palette'}>
                      <MotionButton
                        type="button"
                        onClick={() => { void handleSavePalette(); }}
                        disabled={isSaving}
                        aria-label="Save palette"
                        aria-pressed={isSaved}
                        transition={{ duration: 0 }}
                        className={`grid size-8 shrink-0 place-items-center rounded-md text-foreground hover:bg-accent disabled:opacity-40 ${isSaved ? 'bg-accent' : ''}`}
                      >
                        <Heart className="size-4" strokeWidth={1.5} aria-hidden />
                      </MotionButton>
                    </Hint>
                  </div>
                </div>
              )}

              {showWork && hasPalette && previewMode === 'palette' && (viewMode === 'list' || viewMode === 'ramp') && (
                <div className={`grid gap-4 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'}`}>
                  {activeColors.map((color, idx) => (
                    <motion.div
                      key={`${activeTab}-${idx}`} // slot, not hex — a new hex would remount the card while the wheel is dragged
                      {...enterMotion(reduce, idx)}
                      whileTap={reduce ? undefined : { scale: 0.99 }}
                    >
                    <PaletteCard
                      color={color}
                      onOpenGrid={setSelectedColorForGrid}
                      onEditScale={handleEditClick}
                      onCopy={(hex) => { navigator.clipboard.writeText(hex); showToast(`Copied ${hex}`); }}
                      onColorUpdate={(updatedColor) => updateListedColor(activeTab, idx, updatedColor)}
                      isPrintMode={isPrintMode}
                      isCompact={viewMode === 'list'}
                      globalConfig={globalCurveConfig}
                    />
                    </motion.div>
                  ))}
                </div>
              )}

              {showWork && hasPalette && previewMode === 'palette' && viewMode === 'gradients' && (
                <GradientList colors={activeColors} globalConfig={globalCurveConfig} onCopy={(t) => { navigator.clipboard.writeText(t); showToast('CSS copied'); }} />
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        </>
      )}
      </motion.div>
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

      {(paletteOpen || (inBuild && customColors.length > 0)) && (
        <CopilotPanel
          open={copilotOpen}
          onToggle={() => setCopilotOpen((value) => !value)}
          onClose={() => setCopilotOpen(false)}
          mode={cardMode ? 'card' : 'palette'}
          onModeChange={inPlayground ? setPigmentoMode : undefined}
          messages={cardMode ? cardMessages : messages}
          input={cardMode ? cardChatInput : chatInput}
          onInput={cardMode ? setCardChatInput : setChatInput}
          onSubmit={(text) => { if (cardMode) void handleCardSubmit(text); else void handleChatSubmit(undefined, text); }}
          loading={cardMode ? isCardLoading : isChatLoading}
          balanceLabel={ownerView ? '' : creditCopy.meter}
          balanceTitle={ownerView ? '' : creditCopy.detail}
          balanceDetail={ownerView ? '' : creditCopy.detail}
          onCredits={ownerView ? undefined : openCredits}
          attention={fabAttention}
        />
      )}

      {/* Modals */}
      {selectedColorForEdit && (
          <ScaleEditorModal
              color={selectedColorForEdit}
              globalConfig={globalCurveConfig}
              onClose={() => setSelectedColorForEdit(null)}
              onSave={handleScaleSave}
              onPreview={handleScalePreview}
              isPremium
          />
      )}
      {isExportOpen && <ExportModal brandPalette={palette} neutralPalette={neutralPalette} semanticPalette={semanticPalette} paletteName={paletteName} globalConfig={globalCurveConfig} onClose={() => setIsExportOpen(false)} />}
      {isTunerOpen && <PaletteTunerModal onClose={() => setIsTunerOpen(false)} isPremium initialCode={getTunerCode()} />}
      {isImportOpen && (
        <ImportModal
          key={importImage ? `${importImage.name}:${importImage.size}:${importImage.lastModified}` : 'browse'}
          onClose={() => { setIsImportOpen(false); setImportImage(null); }}
          onImport={handleImport}
          limit={200}
          isPremium
          imageFile={importImage}
        />
      )}
      {isLibraryOpen && <PaletteLibraryModal palettes={savedPalettes} isLoading={isLibraryLoading} accountStorage={paletteOwnerId !== 'local'} maxPalettes={MAX_SAVED_PALETTES} onClose={() => setIsLibraryOpen(false)} onLoadPalette={handleLoadPalette} onDeletePalette={handleDeleteRequest} onRenamePalette={renameLibraryPalette} isPremium />}
      {isPricingOpen && <PricingModal onClose={() => { setIsPricingOpen(false); setCheckoutError(null); }} onCheckout={handleUpgradeCheckout} isLoading={isCheckoutLoading} loadingPack={checkoutPack} error={checkoutError} limitType="ai" />}
      {paletteToDelete && <ConfirmModal title="Delete Palette?" message="This action cannot be undone." onConfirm={performDelete} onCancel={() => setPaletteToDelete(null)} confirmText="Delete" isDestructive={true} />}
    </div>
  );
};

export default App;
