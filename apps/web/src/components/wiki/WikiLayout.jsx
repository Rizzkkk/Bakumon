import { WikiSidebar } from './WikiSidebar.jsx';

// Sidebar + <main>, plus an optional right rail - only the Pokemon index (Phase 4) uses the
// rail, hence it staying a named slot rather than a second child.
export function WikiLayout({ children, rail }) {
  return (
    <div className="wiki-layout">
      <WikiSidebar />
      <main className="wiki-layout__main">{children}</main>
      {rail ? <div className="wiki-layout__rail">{rail}</div> : null}
    </div>
  );
}
