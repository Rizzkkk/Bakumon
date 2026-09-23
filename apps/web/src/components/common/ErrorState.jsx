import { DISCORD_INVITE } from '../../lib/serverFacts.js';
import { PixelIcon } from './PixelIcon.jsx';
import { EmptyState } from './EmptyState.jsx';

// states-pokemon-light.html's "The wiki can't load right now" panel: role="alert",
// --danger-bg, a Try again button and a Discord link. A 429 is never auto-retried (an
// automatic retry against a shared rate bucket is how a search box becomes a retry storm)
// so the button always hands the decision to a person.
export function ErrorState({ error, onRetry }) {
  if (error?.status === 404) {
    return <EmptyState icon="warning" title="Not found" detail={error.message} />;
  }

  const rateLimited = error?.status === 429;
  const wait = error?.retryAfterSeconds;
  const title = rateLimited ? 'Too many requests' : "The wiki can't load right now";
  const detail = rateLimited
    ? (wait
      ? `The wiki is rate limited. Try again in about ${wait} second${wait === 1 ? '' : 's'}.`
      : 'The wiki is rate limited. Wait a moment and try again.')
    : (error?.message ?? "We couldn't reach the spawn data. Try again in a minute, or check Discord for news.");

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 24,
        background: 'var(--danger-bg)',
        border: '2px solid var(--line)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--danger)' }}>
        <PixelIcon name="warning" size={27} />
        <h3 style={{ margin: 0, font: 'var(--type-h3)', color: 'var(--text)' }}>{title}</h3>
      </div>
      <p style={{ margin: 0, color: 'var(--muted)' }}>{detail}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              height: 44,
              padding: '0 16px',
              background: 'var(--text)',
              color: 'var(--bg)',
              border: '2px solid var(--line-strong)',
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        ) : null}
        <a
          href={DISCORD_INVITE}
          rel="noopener noreferrer"
          target="_blank"
          style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}
        >
          Check Discord for status
        </a>
      </div>
    </div>
  );
}
