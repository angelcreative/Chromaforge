import React from 'react';
import { MusicPlayerCard, SocialPostCard, VideoCallCard, VideoCard } from './media';
import { CookieConsentCard, FeedbackCard, LoginCard, PaymentCard, PinCard, PreferencesCard, SearchCard, UploadCard } from './forms';
import { CalendarCard, DroneMonitorCard, SalesCard, StatsCard, StepsCard, StorageCard, WeatherCard, WorkoutCard } from './data';
import { BoardingPassCard, CandidatesCard, ChatCard, ContactCard, CreditCardCard, FoodOrderCard, ProductCard, ProfileCard } from './social';
import { AlarmCard, CodeSnippetCard, LoadingCard, MapCard, MenubarCard, OnboardingCard, StatusMessagesCard } from './system';

export type CardCategory = 'Media' | 'Forms' | 'Data' | 'Social' | 'Commerce' | 'System';
export const CARD_CATEGORIES: CardCategory[] = ['Media', 'Forms', 'Data', 'Social', 'Commerce', 'System'];

export interface CardDef {
  id: string;
  name: string;
  category: CardCategory;
  component: React.FC<any>;
}

export const PLAYGROUND_CARDS: CardDef[] = [
  { id: 'music-player', name: 'Music player', category: 'Media', component: MusicPlayerCard },
  { id: 'video', name: 'Video', category: 'Media', component: VideoCard },
  { id: 'social-post', name: 'Social post', category: 'Media', component: SocialPostCard },
  { id: 'video-call', name: 'Video call', category: 'Media', component: VideoCallCard },
  { id: 'login', name: 'Sign in', category: 'Forms', component: LoginCard },
  { id: 'preferences', name: 'Preferences', category: 'Forms', component: PreferencesCard },
  { id: 'upload', name: 'File upload', category: 'Forms', component: UploadCard },
  { id: 'feedback', name: 'Feedback', category: 'Forms', component: FeedbackCard },
  { id: 'pin', name: 'Verification code', category: 'Forms', component: PinCard },
  { id: 'payment', name: 'Payment', category: 'Forms', component: PaymentCard },
  { id: 'search', name: 'Search', category: 'Forms', component: SearchCard },
  { id: 'cookie-consent', name: 'Cookie consent', category: 'Forms', component: CookieConsentCard },
  { id: 'stats', name: 'Metrics', category: 'Data', component: StatsCard },
  { id: 'sales', name: 'Revenue', category: 'Data', component: SalesCard },
  { id: 'storage', name: 'Storage', category: 'Data', component: StorageCard },
  { id: 'weather', name: 'Weather', category: 'Data', component: WeatherCard },
  { id: 'calendar', name: 'Calendar', category: 'Data', component: CalendarCard },
  { id: 'workout', name: 'Workout', category: 'Data', component: WorkoutCard },
  { id: 'steps', name: 'Steps', category: 'Data', component: StepsCard },
  { id: 'drone-monitor', name: 'Drone monitor', category: 'Data', component: DroneMonitorCard },
  { id: 'chat', name: 'Chat', category: 'Social', component: ChatCard },
  { id: 'profile', name: 'Profile', category: 'Social', component: ProfileCard },
  { id: 'contact', name: 'Contact', category: 'Social', component: ContactCard },
  { id: 'candidates', name: 'Candidates', category: 'Social', component: CandidatesCard },
  { id: 'product', name: 'Product', category: 'Commerce', component: ProductCard },
  { id: 'food-order', name: 'Food order', category: 'Commerce', component: FoodOrderCard },
  { id: 'credit-card', name: 'Bank card', category: 'Commerce', component: CreditCardCard },
  { id: 'boarding-pass', name: 'Boarding pass', category: 'Commerce', component: BoardingPassCard },
  { id: 'onboarding', name: 'Onboarding', category: 'System', component: OnboardingCard },
  { id: 'status', name: 'Status messages', category: 'System', component: StatusMessagesCard },
  { id: 'loading', name: 'Loading states', category: 'System', component: LoadingCard },
  { id: 'alarm', name: 'Alarms', category: 'System', component: AlarmCard },
  { id: 'menubar', name: 'Menubar', category: 'System', component: MenubarCard },
  { id: 'code-snippet', name: 'Code snippet', category: 'System', component: CodeSnippetCard },
  { id: 'map', name: 'Map', category: 'System', component: MapCard },
];
