import { Route, Routes } from 'react-router-dom';
import { Header } from './components/layout/Header.jsx';
import { Footer } from './components/layout/Footer.jsx';
import Landing from './pages/Landing.jsx';
import WikiHome from './pages/WikiHome.jsx';
import PokemonDetail from './pages/PokemonDetail.jsx';
import ItemDetail from './pages/ItemDetail.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/wiki" element={<WikiHome />} />
          <Route path="/wiki/pokemon/:slug" element={<PokemonDetail />} />
          <Route path="/wiki/items/:itemId" element={<ItemDetail />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          {/* No /cookie-preferences route. The site sets no cookies, so there is nothing
              to consent to and nothing to configure. ADR 0007. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
