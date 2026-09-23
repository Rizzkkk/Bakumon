import { Route, Routes } from 'react-router-dom';
import { Header } from './components/layout/Header.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { WikiLayout } from './components/wiki/WikiLayout.jsx';
import { FilterRail } from './components/wiki/FilterRail.jsx';
import Landing from './pages/Landing.jsx';
import WikiHome from './pages/WikiHome.jsx';
import PokemonIndex from './pages/PokemonIndex.jsx';
import ItemsIndex from './pages/ItemsIndex.jsx';
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
          {/* Every wiki-*.html artboard renders the sidebar/drawer shell around its
              content, so the wrap happens once here rather than inside each page. */}
          <Route path="/wiki" element={<WikiLayout><WikiHome /></WikiLayout>} />
          <Route path="/wiki/pokemon" element={<WikiLayout rail={<FilterRail />}><PokemonIndex /></WikiLayout>} />
          <Route path="/wiki/items" element={<WikiLayout><ItemsIndex /></WikiLayout>} />
          <Route path="/wiki/pokemon/:slug" element={<WikiLayout><PokemonDetail /></WikiLayout>} />
          <Route path="/wiki/items/:itemId" element={<WikiLayout><ItemDetail /></WikiLayout>} />
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
