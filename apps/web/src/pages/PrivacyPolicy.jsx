import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { DISCORD_INVITE } from '../lib/serverFacts.js';
import { LegalArticle, LegalSection } from '../components/common/LegalArticle.jsx';

// Every claim on this page is a fact about the deployed system, not boilerplate. ADR 0007
// is what makes it this short: no analytics, no tracking pixels, no third-party embeds and
// no cookies at all. Adding any of those later falsifies this page, which is why ADR 0007
// requires a superseding ADR and a rewrite of this copy in the same pass - not a quiet
// script tag.
export default function PrivacyPolicy() {
  usePageTitle('Privacy');

  return (
    <LegalArticle
      title="Privacy"
      updated="Last updated 23 September 2026"
      lede="Short version: this site does not know who you are, and it does not try to find out."
    >
      <p>
        Bakumon is a community fan project for a Minecraft server. This site is a landing
        page and a wiki. It has no accounts, no sign-in and no comment section, so there is
        very little to say here - and what there is, is said plainly.
      </p>

      <LegalSection title="This site sets no cookies">
        <p>
          None. Not for analytics, not for preferences, not for anything. There is no
          analytics service, no tracking pixel and no third-party embed on any page. That is
          a deliberate decision recorded in the project's own documentation, not an
          accident, and it is why you were not asked to consent to anything.
        </p>
      </LegalSection>

      <LegalSection title="We do not collect personal data">
        <p>
          There are no accounts, so there is nothing to sign up with. No form on this site
          asks for your name, your email address or anything else, because there are no
          forms. The search box sends what you type to our own server so it can return
          results; it is not stored against you and not shared.
        </p>
      </LegalSection>

      <LegalSection title="What the server logs">
        <p>
          Like essentially every web server, ours records each request it answers: the
          method, the path, the response status and how long it took. Your IP address is
          used in memory to apply rate limits so one client cannot overwhelm the site. These
          logs exist to keep the site running and to diagnose faults. They are not used to
          build a profile of you, and they are not sold or shared.
        </p>
      </LegalSection>

      <LegalSection title="Stored in your browser">
        <p>
          If you switch between light and dark themes, that choice is saved in your own
          browser's local storage so the site remembers it on your next visit. It is
          strictly necessary for the toggle to work, it is not a cookie, and it never leaves
          your device - we cannot see it and nothing is sent to our server because of it.
          You can clear it at any time from your browser's own settings.
        </p>
      </LegalSection>

      <LegalSection title="Leaving this site">
        <p>
          The Discord invite and the credit links in the footer take you to services we do
          not run - Discord, PokeAPI, the Cobblemon Wiki, GitLab and Creative Commons. Once
          you follow one of those links, that service's own privacy policy applies and ours
          does not. Nothing is shared with them by you being here.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>This site collects no personal data from anyone, of any age.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this page, or about anything else, go to the server's Discord:{' '}
          <a href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">{DISCORD_INVITE}</a>.
          That is the project's contact route.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this ever stops being accurate - if analytics were added, for instance - this
          page gets rewritten in the same change, not afterwards. The date at the top is
          when it was last true.
        </p>
      </LegalSection>

      <p><Link to="/terms-of-service">Terms of use</Link></p>
    </LegalArticle>
  );
}
