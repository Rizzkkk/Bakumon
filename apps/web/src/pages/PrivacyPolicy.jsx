import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { DISCORD_INVITE } from '../lib/serverFacts.js';

// Every claim on this page is a fact about the deployed system, not boilerplate. ADR 0007
// is what makes it this short: no analytics, no tracking pixels, no third-party embeds and
// no cookies at all. Adding any of those later falsifies this page, which is why ADR 0007
// requires a superseding ADR and a rewrite of this copy in the same pass - not a quiet
// script tag.
export default function PrivacyPolicy() {
  usePageTitle('Privacy');

  return (
    <div className="page stack prose">
      <h1>Privacy</h1>
      <p className="card__meta">Last updated 23 September 2026.</p>

      <p>
        Bakumon is a community fan project for a Minecraft server. This site is a landing
        page and a wiki. It has no accounts, no sign-in and no comment section, so there is
        very little to say here - and what there is, is said plainly.
      </p>

      <h2>This site sets no cookies</h2>
      <p>
        None. Not for analytics, not for preferences, not for anything. There is no
        analytics service, no tracking pixel and no third-party embed on any page. That is
        a deliberate decision recorded in the project's own documentation, not an
        accident, and it is why you were not asked to consent to anything.
      </p>

      <h2>We do not collect personal data</h2>
      <p>
        There are no accounts, so there is nothing to sign up with. No form on this site
        asks for your name, your email address or anything else, because there are no
        forms. The search box sends what you type to our own server so it can return
        results; it is not stored against you and not shared.
      </p>

      <h2>What the server logs</h2>
      <p>
        Like essentially every web server, ours records each request it answers: the
        method, the path, the response status and how long it took. Your IP address is used
        in memory to apply rate limits so one client cannot overwhelm the site. These logs
        exist to keep the site running and to diagnose faults. They are not used to build a
        profile of you, and they are not sold or shared.
      </p>

      <h2>Leaving this site</h2>
      <p>
        The Discord invite and the credit links in the footer take you to services we do
        not run - Discord, PokeAPI, the Cobblemon Wiki, GitLab and Creative Commons. Once
        you follow one of those links, that service's own privacy policy applies and ours
        does not. Nothing is shared with them by you being here.
      </p>

      <h2>Children</h2>
      <p>
        This site collects no personal data from anyone, of any age.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this page, or about anything else, go to the server's Discord:{' '}
        <a href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">{DISCORD_INVITE}</a>.
        That is the project's contact route.
      </p>

      <h2>Changes</h2>
      <p>
        If this ever stops being accurate - if analytics were added, for instance - this
        page gets rewritten in the same change, not afterwards. The date at the top is when
        it was last true.
      </p>

      <p><Link to="/terms-of-service">Terms of use</Link></p>
    </div>
  );
}
