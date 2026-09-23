import { WikiNav, WikiNavIcon, WIKI_NAV_TITLE } from './WikiNav.jsx';

// Desktop only (shell.css hides it below 768px) - WikiDrawer is the mobile equivalent.
export function WikiSidebar() {
  return (
    <aside className="wiki-sidebar">
      <div className="wiki-sidebar__title">
        <WikiNavIcon />
        <span>{WIKI_NAV_TITLE}</span>
      </div>
      <WikiNav />
    </aside>
  );
}
