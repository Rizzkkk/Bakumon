import { usePageTitle } from '../hooks/usePageTitle.js';
import { Hero } from '../components/landing/Hero.jsx';
import { FeatureCards } from '../components/landing/FeatureCards.jsx';
import { DiscordCTA } from '../components/landing/DiscordCTA.jsx';
import { MobileCtaBar } from '../components/landing/MobileCtaBar.jsx';

export default function Landing() {
  // Undefined rather than 'Home': usePageTitle falls back to the bare site name, so the
  // landing tab reads "Bakumon Wiki" instead of "Home - Bakumon Wiki".
  usePageTitle(undefined);

  // No API call anywhere on this page - it must render completely with the API down.
  return (
    <>
      <Hero />
      <FeatureCards />
      <DiscordCTA />
      <MobileCtaBar />
    </>
  );
}
