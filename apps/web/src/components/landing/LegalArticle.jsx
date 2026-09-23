// Shared shell for /privacy-policy and /terms-of-service, styled from privacy-d-light.html
// / terms-d-light.html. Lives here rather than in components/wiki or components/common
// because this phase does not own either of those directories - the shell has nothing
// wiki-specific about it, but this is the one place available to put it.
export function LegalArticle({ title, updated, lede, children }) {
  return (
    <div className="page legal">
      <article className="legal__article">
        <div className="legal__head">
          <h1 className="legal__title">{title}</h1>
          <span className="legal__meta mono">{updated}</span>
          {lede ? <p className="legal__lede">{lede}</p> : null}
        </div>
        {children}
      </article>
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section className="legal__section">
      <h2 className="legal__heading">{title}</h2>
      {children}
    </section>
  );
}
