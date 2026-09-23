// 1,635 images. Alt text at that count is generated from the display name at render time,
// never hand-written: a hand-written set drifts the moment the workbook is re-exported, and
// nobody writes 1,635 of them. pre-production.md item 18.
//
// "official artwork" was true for all 904 Pokemon images until ADR 0012: 66 species now
// render a Cobblemon wiki model instead, which is not official Pokemon Company art.
//
// The unknown case names no source rather than guessing one. Only the detail response
// carries imageSource, so every index thumbnail arrives here with source undefined - and
// 66 of those 904 are wiki renders. Defaulting to "official artwork" would read that claim
// aloud, wrongly, on 7% of rows. Alt text is asserted as fact to someone who cannot see the
// image, so it says less rather than something untrue.
export const pokemonAlt = (displayName, source) => {
  if (source === 'wiki') return `${displayName} Cobblemon wiki render`;
  if (source === 'pokeapi') return `${displayName} official artwork`;
  return `${displayName} artwork`;
};

// Deliberately the raw stored name, placeholder and all. Alt text is read aloud in a
// context where the visual placeholder chip cannot exist, so substituting a flavour word
// here would be inventing data that the workbook does not contain.
export const itemAlt = (name) => `${name} item icon`;
