import { splitPlaceholders } from '../../lib/placeholderName.js';

// Four real items carry a %s the game substitutes with a Poke Puff flavour at runtime, so
// the workbook stores a template rather than a finished string. The token is rendered, not
// stripped: the workbook is authoritative (ADR 0004) and hiding it would hide real content
// a player can hold. Styling it as a placeholder is a display decision at the point of
// use, which is where known-gaps.md always said it belonged. ADR 0009.
//
// The title carries the raw stored string, so the exact workbook value is always one hover
// away and never has to be inferred from the rendered chip.
export function ItemName({ name, placeholderLabel = 'flavour' }) {
  const parts = splitPlaceholders(name);
  if (parts.length === 1) return name;

  return (
    <span title={name}>
      {parts.map((part, index) => (part.token
        ? <span key={index} className="placeholder-token">{placeholderLabel}</span>
        : <span key={index}>{part.text}</span>))}
    </span>
  );
}
