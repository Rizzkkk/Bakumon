import { WikiSidebar } from './WikiSidebar.jsx';

// Sidebar + <main>, plus an optional right rail - only the Pokemon index (Phase 4) uses the
// rail, hence it staying a named slot rather than a second child.
export function WikiLayout({ children, rail }) {
  return (
    <div className="wiki-layout">
      <WikiSidebar />
      {/* The sidebar sits flush against the viewport's left edge, so the page's centred
          measure belongs to this wrapper rather than to the row that contains both. */}
      <div className="wiki-layout__content">
        <main className="wiki-layout__main">{children}</main>
      </div>
      {/* Outside the centred wrapper, like the sidebar: both panels take a screen edge and
          the measure between them stays centred. */}
      {rail ? <div className="wiki-layout__rail">{rail}</div> : null}
    </div>
  );
}
