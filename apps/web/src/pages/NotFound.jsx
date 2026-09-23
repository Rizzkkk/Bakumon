import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { StateBlock } from '../components/common/StateBlock.jsx';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <div className="page">
      <StateBlock
        variant="empty"
        title="Page not found"
        detail="That page does not exist on this wiki."
        action={<p><Link className="chip" to="/wiki">Go to the wiki</Link></p>}
      />
    </div>
  );
}
