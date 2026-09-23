import { useId } from 'react';
import { WikiNav, WikiNavIcon, WIKI_NAV_TITLE } from './WikiNav.jsx';
import { WikiSearchField } from './WikiSearchField.jsx';

// Desktop only (shell.css hides it below 768px) - WikiDrawer is the mobile equivalent,
// and the search below 768px is the header sub-bar's, not this one.
export function WikiSidebar() {
  const searchId = useId();

  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar__title">
        <WikiNavIcon />
        <span>{WIKI_NAV_TITLE}</span>
      </div>
      <WikiSearchField
        id={searchId}
        className="wiki-sidebar__search"
        placeholder="Search Pokemon and items"
      />
      <WikiNav />
    </aside>
  );
}
