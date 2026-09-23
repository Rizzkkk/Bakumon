import { useEffect, useRef } from 'react';
import { PixelIcon } from './PixelIcon.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// One dialog shell for both the site menu and the wiki menu (ADR 0010 - the site menu has
// no artboard and deliberately mirrors this one). Unmounts entirely when closed rather than
// hiding with CSS, so a closed drawer never holds focus, never fetches and never sits in
// the tab order.
export function Drawer({ open, onClose, titleId, title, closeLabel, children, icon }) {
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const firstFocusable = drawerRef.current?.querySelector(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(drawerRef.current?.querySelectorAll(FOCUSABLE) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-scrim" aria-hidden="true" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={drawerRef}>
        <div className="drawer__header">
          {icon}
          <h2 id={titleId} className="drawer__title">{title}</h2>
          <button type="button" className="icon-button drawer__close" aria-label={closeLabel} onClick={onClose}>
            <PixelIcon name="close" size={16} />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
      </div>
    </>
  );
}
