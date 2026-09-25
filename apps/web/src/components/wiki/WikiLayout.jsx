import { WikiSidebar } from './WikiSidebar.jsx';

// Sidebar + content, plus an optional right rail - only the Pokemon index (Phase 4) uses
// the rail, hence it staying a named slot rather than a second child.
export function WikiLayout({ children, rail }) {
  return (
    <div className="wiki-layout">
      <WikiSidebar />
      {/* The sidebar sits flush against the viewport's left edge, so the page's centred
          measure belongs to this wrapper rather than to the row that contains both. */}
      <div className="wiki-layout__content">
        {/* A div, not a <main>. App.jsx already wraps every route in <main id="main">, and
            this rendered a second one inside it on all five wiki routes. Two main landmarks
            is invalid, and a screen reader's "jump to main" lands on whichever it picks -
            the skip link targets the outer one. The class carries the layout either way. */}
        <div className="wiki-layout__main">{children}</div>
      </div>
      {/* Outside the centred wrapper, like the sidebar: both panels take a screen edge and
          the measure between them stays centred. */}
      {rail ? <div className="wiki-layout__rail">{rail}</div> : null}
    </div>
  );
}
