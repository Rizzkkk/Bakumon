import { Link } from 'react-router-dom';
import { useHead } from '../hooks/useHead.js';
import { DISCORD_INVITE } from '../lib/serverFacts.js';
import { LegalArticle, LegalSection } from '../components/common/LegalArticle.jsx';

export default function TermsOfService() {
  useHead({
    title: 'Terms of Use - Bakumon',
    description: 'The terms for using the Bakumon community wiki, and what the spawn and '
      + 'item data on it does and does not describe.',
  });

  return (
    <LegalArticle title="Terms of use" updated="Last updated 23 September 2026">
      <p>
        Bakumon is a community fan project run by players, for players. This page covers
        the website. Conduct on the Minecraft server itself is handled in Discord, by the
        people who run it.
      </p>

      <LegalSection title="Not affiliated with anyone">
        <p>
          Bakumon is not affiliated with, endorsed by or associated with Cobblemon,
          The Pokemon Company, Nintendo, Game Freak or Mojang. Pokemon and Minecraft are
          trademarks of their respective owners. This is a fan project and nothing on it
          should be read as official.
        </p>
      </LegalSection>

      <LegalSection title="Where the content comes from">
        <p>
          The spawn and item data on this wiki describes <em>this server's</em>
          {' '}configuration. It is maintained by the server's own records and will not match
          an unmodified Cobblemon install.
        </p>
        <ul>
          <li>
            Pokemon artwork comes from{' '}
            <a href="https://github.com/PokeAPI/sprites" rel="noreferrer noopener" target="_blank">PokeAPI</a>.
          </li>
          <li>
            Item artwork and some item descriptions come from the{' '}
            <a href="https://wiki.cobblemon.com" rel="noreferrer noopener" target="_blank">Cobblemon Wiki</a>,
            licensed{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer noopener" target="_blank">CC BY 4.0</a>.
            Where a description came from there, the page says so next to the text.
          </li>
          <li>
            Some item textures come from{' '}
            <a href="https://gitlab.com/cable-mc/cobblemon" rel="noreferrer noopener" target="_blank">Cobblemon</a>,
            licensed MPL-2.0.
          </li>
        </ul>
        <p>
          If you reuse anything from here, carry those credits and licences with it. They
          are conditions of use, not decoration.
        </p>
      </LegalSection>

      <LegalSection title="Accuracy">
        <p>
          The wiki is generated from the server's records and is kept as accurate as we can
          make it, but it can fall behind a configuration change, and some of it is
          incomplete - many items have no description at all, for example. It is provided
          as is, without warranty. Do not rely on it for anything that matters outside the
          game.
        </p>
      </LegalSection>

      <LegalSection title="Using the site">
        <p>
          Browse it, link to it, quote it. Please do not scrape it at a rate that degrades
          it for other people; the site is rate limited and will start refusing requests.
          If you want the underlying data in bulk, ask in Discord rather than hammering the
          site.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          This is a volunteer-run project on a single small server. It may be slow,
          unavailable or withdrawn at any time, without notice.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Corrections and questions go to the Discord:{' '}
          <a href={DISCORD_INVITE} rel="noreferrer noopener" target="_blank">{DISCORD_INVITE}</a>.
          Telling us something is wrong is genuinely welcome - the wiki gets better that
          way.
        </p>
      </LegalSection>

      <p><Link to="/privacy-policy">Privacy</Link></p>
    </LegalArticle>
  );
}
