import { Drawer } from '../common/Drawer.jsx';
import { WikiNav, WikiNavIcon, WIKI_NAV_TITLE } from './WikiNav.jsx';

export function WikiDrawer({ open, onClose }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      titleId="wiki-menu-title"
      title={WIKI_NAV_TITLE}
      icon={<WikiNavIcon />}
      closeLabel="Close wiki menu"
    >
      <WikiNav />
    </Drawer>
  );
}
