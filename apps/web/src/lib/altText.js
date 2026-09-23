// 1,635 images. Alt text at that count is generated from the display name at render time,
// never hand-written: a hand-written set drifts the moment the workbook is re-exported, and
// nobody writes 1,635 of them. pre-production.md item 18.
export const pokemonAlt = (displayName) => `${displayName} official artwork`;

// Deliberately the raw stored name, placeholder and all. Alt text is read aloud in a
// context where the visual placeholder chip cannot exist, so substituting a flavour word
// here would be inventing data that the workbook does not contain.
export const itemAlt = (name) => `${name} item icon`;
