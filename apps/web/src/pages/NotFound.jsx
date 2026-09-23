import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { EmptyState } from '../components/common/EmptyState.jsx';

export default function NotFound() {
  usePageTitle('Page not found');

  return (
    <div className="page">
      <EmptyState title="Page not found" detail="That page does not exist on this wiki.">
        <Link className="chip" to="/wiki">Go to the wiki</Link>
      </EmptyState>
    </div>
  );
}
