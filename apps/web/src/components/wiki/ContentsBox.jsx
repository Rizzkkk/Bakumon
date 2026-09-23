import { PixelIcon } from '../common/PixelIcon.jsx';

// items: [{ id, label, children?: [{ id, label }] }]. Rendered twice - a <nav> for desktop,
// a <details> for mobile - toggled by breakpoint in article.css rather than by JS, matching
// WikiSidebar/WikiDrawer's own dual-render pattern.
function List({ items }) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`}>{item.label}</a>
          {item.children?.length ? (
            <ol>
              {item.children.map((child) => (
                <li key={child.id ?? child.label}>
                  {/* A truncated tail ("14 more patterns") names no single anchor, so it is
                      plain text rather than a link that would go nowhere. */}
                  {child.id ? <a href={`#${child.id}`}>{child.label}</a> : <span>{child.label}</span>}
                </li>
              ))}
            </ol>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function ContentsBox({ items }) {
  return (
    <>
      <nav aria-label="Contents" className="contents-box contents-box--desktop">
        <span className="contents-box__title">Contents</span>
        <List items={items} />
      </nav>

      <details className="contents-box contents-box--mobile">
        <summary>
          <PixelIcon name="chevron-right" size={16} />
          Contents
        </summary>
        <div className="contents-box--mobile__body">
          <List items={items} />
        </div>
      </details>
    </>
  );
}
