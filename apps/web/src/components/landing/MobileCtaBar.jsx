import { CtaButton } from '../common/CtaButton.jsx';

// landing-m-dark.html: an 84px spacer so the fixed bar never overlaps the footer's last
// line, then the bar itself. Hidden above the mobile breakpoint in pages.css - this is the
// same tree on every viewport, just shown or hidden by CSS, per ADR 0008's constraint that
// module-scope code must not depend on viewport at render time.
export function MobileCtaBar() {
  return (
    <>
      <div className="mobile-cta-spacer" aria-hidden="true" />
      <div className="mobile-cta-bar">
        <CtaButton size={52} style={{ width: '100%', justifyContent: 'center' }} />
      </div>
    </>
  );
}
