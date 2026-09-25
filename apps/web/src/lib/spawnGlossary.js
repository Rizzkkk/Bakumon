/*
 * What the six columns of a spawn row mean, defined once.
 *
 * These lived in two places - the wiki hub's tutorial section and the species page's
 * reference box - and they had already drifted on the one that matters. Weight was "the
 * relative chance of this rule winning against the others eligible at the same moment" in
 * one and "chance relative to other spawns in the same bucket and place" in the other.
 * Both constraints are real and neither copy carried both, so a reader got a different
 * rule depending on which page they happened to read.
 *
 * `short` and `long` are deliberately both kept. The hub is teaching someone who has never
 * seen a spawn table; the species page is reminding someone already looking at one. What
 * must not differ is the claim, and keeping the two registers adjacent here means a change
 * to one is made with the other in view.
 */
export const SPAWN_GLOSSARY = [
  {
    term: 'Bucket',
    short: "How rare the spawn is. Ultra-rare is Bakumon's own tier above rare.",
    long: 'How rare the roll is: common, uncommon, rare, ultra-rare, or legendary. A species '
      + 'can sit in more than one, depending on where and when it spawns.',
  },
  {
    term: 'Weight',
    short: 'Relative chance against the other rules in the same bucket that are eligible at '
      + 'that moment. Higher is more often.',
    long: 'How likely this rule is to win against the other rules eligible at that moment, '
      + 'within the same bucket. It is a weight, not a percentage.',
  },
  {
    term: 'Level',
    short: 'Level range the Pokemon spawns at.',
    long: 'The range the Pokemon can appear at when this rule fires.',
  },
  {
    term: 'Context',
    short: 'Where it appears: on the ground, in water, from fishing.',
    long: 'What you have to be doing for the rule to apply: walking on the surface, '
      + 'fishing, or underground.',
  },
  {
    term: 'Biomes',
    short: 'Where the row applies. The group icon marks a biome tag covering many biomes.',
    long: 'Where it applies. See below.',
  },
  {
    term: 'Conditions',
    short: 'Time, weather, moon, chunk and anything else the row needs.',
    long: 'Anything else the rule requires: time of day, moon phase, or a detail such as '
      + 'being inside a slime chunk.',
  },
];

export const spawnGlossaryRows = (register) =>
  SPAWN_GLOSSARY.map(({ term, [register]: description }) => ({ term, description }));
