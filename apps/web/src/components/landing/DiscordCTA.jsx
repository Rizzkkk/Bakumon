import { DISCORD_INVITE } from '../../lib/serverFacts.js';

export function DiscordCTA() {
  return (
    <section className="panel cta">
      <h2 style={{ margin: 0 }}>Everything else is in Discord</h2>
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
        The server address, the version, the modpack and how to join are all posted there.
        They live in Discord rather than on this page so they stay current without waiting
        on a site update.
      </p>
      <p style={{ margin: 0 }}>
        <a className="button button--primary" href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">
          Join the Discord
        </a>
      </p>
    </section>
  );
}
