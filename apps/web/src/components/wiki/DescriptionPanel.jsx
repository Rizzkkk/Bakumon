// descriptionSource is not decoration. A description sourced from the Cobblemon Wiki is
// CC BY 4.0 content and the licence requires attribution at the point of use, not only in
// a footer - which is exactly why the API exposes the field. ADR 0004, attribution.md.
export function DescriptionPanel({ description, descriptionSource }) {
  if (!description) {
    // 516 of the 934 items have no description on either axis. That is not an error and
    // not an empty string to be hidden - it is the majority case, so it gets real copy
    // rather than a blank panel. known-gaps.md entry 3.
    return (
      <div className="panel">
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          No description recorded. Most items in this wiki have no description in the
          server's workbook and none on the Cobblemon Wiki.
        </p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <p style={{ margin: 0 }}>{description}</p>
      {descriptionSource === 'wiki' ? (
        <p className="card__meta" style={{ margin: 0 }}>
          Description from the{' '}
          <a href="https://wiki.cobblemon.com" rel="noreferrer noopener" target="_blank">Cobblemon Wiki</a>,
          licensed{' '}
          <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener" target="_blank">CC BY 4.0</a>.
        </p>
      ) : null}
    </div>
  );
}
