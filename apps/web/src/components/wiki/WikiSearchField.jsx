import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PixelIcon } from '../common/PixelIcon.jsx';

// Third copy of this field - the header's desktop one, the mobile sub-bar's, and now the
// sidebar's - which is the point conventions.md says to extract at. The caller passes a
// class for placement only; the field's own box is `wiki-search`.
export function WikiSearchField({ id, className = '', placeholder }) {
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  const onSubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    navigate(`/wiki?${next.toString()}`);
  };

  return (
    <form role="search" className={`wiki-search ${className}`.trim()} onSubmit={onSubmit}>
      <label htmlFor={id} className="visually-hidden">Search the wiki</label>
      <span className="wiki-search__icon" aria-hidden="true">
        <PixelIcon name="search" size={20} />
      </span>
      <input
        id={id}
        type="search"
        className="wiki-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
    </form>
  );
}
