import { usePageTitle } from '../hooks/usePageTitle.js';
import { Hero } from '../components/landing/Hero.jsx';
import { ScreenshotGrid } from '../components/landing/ScreenshotGrid.jsx';
import { DiscordCTA } from '../components/landing/DiscordCTA.jsx';

export default function Landing() {
  // Undefined rather than 'Home': usePageTitle falls back to the bare site name, so the
  // landing tab reads "Bakumon Wiki" instead of "Home - Bakumon Wiki".
  usePageTitle(undefined);

  return (
    <>
      <Hero />
      <div className="page stack">
        <ScreenshotGrid />
        <DiscordCTA />
      </div>
    </>
  );
}
