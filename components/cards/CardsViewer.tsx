import React, { Suspense, lazy } from 'react';
import { ThemeColors } from './BaseComponents';

// Lazy load all card components
const MusicPlayerCard = lazy(() => import('./cards/MusicPlayerCard'));
const LoginCard = lazy(() => import('./cards/LoginCard'));
const OnboardingCard = lazy(() => import('./cards/OnboardingCard'));
const CandidatesCard = lazy(() => import('./cards/CandidatesCard'));
const StatsCard = lazy(() => import('./cards/StatsCard'));
const FormCard = lazy(() => import('./cards/FormCard'));
const FeedbackCard = lazy(() => import('./cards/FeedbackCard'));
const CalendarCard = lazy(() => import('./cards/CalendarCard'));
const UploadCard = lazy(() => import('./cards/UploadCard'));
const WeatherCard = lazy(() => import('./cards/WeatherCard'));
const LoadingCard = lazy(() => import('./cards/LoadingCard'));
const InstagramCard = lazy(() => import('./cards/InstagramCard'));
const MapCard = lazy(() => import('./cards/MapCard'));
const CreditCard = lazy(() => import('./cards/CreditCard'));
const StorageCard = lazy(() => import('./cards/StorageCard'));
const CookieConsentCard = lazy(() => import('./cards/CookieConsentCard'));
const ProductCard = lazy(() => import('./cards/ProductCard'));
const AlarmCard = lazy(() => import('./cards/AlarmCard'));
const ContactProfileCard = lazy(() => import('./cards/ContactProfileCard'));
const BoardingCard = lazy(() => import('./cards/BoardingCard'));
const WalkCard = lazy(() => import('./cards/WalkCard'));
const SearchCard = lazy(() => import('./cards/SearchCard'));
const WorkoutCard = lazy(() => import('./cards/WorkoutCard'));
const ChatCard = lazy(() => import('./cards/ChatCard'));
const ProfileCard = lazy(() => import('./cards/ProfileCard'));
const SalesCard = lazy(() => import('./cards/SalesCard'));
const VideoCard = lazy(() => import('./cards/VideoCard'));
const DroneMonitorCard = lazy(() => import('./cards/DroneMonitorCard'));
const PinCard = lazy(() => import('./cards/PinCard'));
const VideoCallCard = lazy(() => import('./cards/VideoCallCard'));
const CodeSnippetCard = lazy(() => import('./cards/CodeSnippetCard'));
const MenubarCard = lazy(() => import('./cards/MenubarCard'));
const PaymentCard = lazy(() => import('./cards/PaymentCard'));
const FoodCard = lazy(() => import('./cards/FoodCard'));

const CARD_COMPONENTS: Record<string, React.LazyExoticComponent<React.FC<{ theme: ThemeColors }>>> = {
  'music-player': MusicPlayerCard,
  'login-card': LoginCard,
  'onboarding-card': OnboardingCard,
  'candidates-card': CandidatesCard,
  'stats-card': StatsCard,
  'form-card': FormCard,
  'feedback-card': FeedbackCard,
  'calendar-card': CalendarCard,
  'upload-card': UploadCard,
  'weather-card': WeatherCard,
  'loading-card': LoadingCard,
  'instagram-card': InstagramCard,
  'map-card': MapCard,
  'credit-card': CreditCard,
  'storage-card': StorageCard,
  'cookie-consent': CookieConsentCard,
  'product-card': ProductCard,
  'alarm-card': AlarmCard,
  'contact-profile': ContactProfileCard,
  'boarding-card': BoardingCard,
  'walk-card': WalkCard,
  'search-card': SearchCard,
  'workout-card': WorkoutCard,
  'chat-card': ChatCard,
  'profile-card': ProfileCard,
  'sales-card': SalesCard,
  'video-card': VideoCard,
  'drone-monitor': DroneMonitorCard,
  'pin-card': PinCard,
  'video-call': VideoCallCard,
  'code-snippet': CodeSnippetCard,
  'menubar-card': MenubarCard,
  'payment-card': PaymentCard,
  'food-card': FoodCard,
};

interface CardsViewerProps {
  selectedCardId: string | null;
  theme: ThemeColors;
}

export const CardsViewer: React.FC<CardsViewerProps> = ({ selectedCardId, theme }) => {
  if (!selectedCardId) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg.page }}
      >
        <div className="text-center">
          <div
            className="text-6xl mb-4 opacity-20"
            style={{ color: theme.text.secondary }}
          >
            🎨
          </div>
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: theme.text.main }}
          >
            Select a card to preview
          </h3>
          <p style={{ color: theme.text.secondary }}>
            Choose a card from the library to see it with your color palette
          </p>
        </div>
      </div>
    );
  }

  const CardComponent = CARD_COMPONENTS[selectedCardId];

  if (!CardComponent) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: theme.bg.page }}
      >
        <p style={{ color: theme.text.secondary }}>Card not found</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-6 md:p-8"
      style={{ backgroundColor: theme.bg.page }}
    >
      <div className="flex justify-center items-start">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div
                  className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4"
                  style={{ borderColor: theme.action.primary }}
                />
                <p style={{ color: theme.text.secondary }}>Loading card...</p>
              </div>
            </div>
          }
        >
          <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <CardComponent theme={theme} />
          </div>
        </Suspense>
      </div>
    </div>
  );
};
