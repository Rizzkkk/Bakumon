import { BucketChip } from './BucketChip.jsx';
import { BiomeLabel } from './BiomeLabel.jsx';
import { EMPTY, levelRange, numberOrEmpty } from '../../lib/labels.js';

const COLUMNS = ['Bucket', 'Weight', 'Level', 'Context', 'Biomes', 'Conditions'];

// Biomes are mostly #-prefixed tags rather than concrete biome names (68 of 112 tokens), and
// a handful of rows carry the literal phrase "Any biome" the workbook author typed. isTag is
// approximated from the leading '#' since the detail response does not carry the biomes
// endpoint's own isTag flag per row.
const isTagToken = (token) => token?.startsWith('#') ?? false;

// One table per spawn group (a form/aspect), rendered inside that group's <details>. Six
// columns, real <table> markup - a card per row would be 46 cards for Magikarp.
export function SpawnTable({ rows }) {
  return (
    <div className="table-scroll">
      <table className="spawn-table">
        <thead>
          <tr>
            {COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td>{row.bucket ? <BucketChip slug={row.bucket} /> : EMPTY}</td>
              <td className="mono">{numberOrEmpty(row.weight)}</td>
              <td className="mono">{levelRange(row.levelMin, row.levelMax)}</td>
              <td>{row.context ?? EMPTY}</td>
              <td>
                {row.biomes?.length ? (
                  <div className="biome-stack">
                    {row.biomes.map((token, biomeIndex) => (
                      <span className="biome-pill" key={`${token}-${biomeIndex}`}>
                        <BiomeLabel token={token} isTag={isTagToken(token)} />
                      </span>
                    ))}
                  </div>
                ) : EMPTY}
              </td>
              {/* conditions is free text served as one string - "Night, Sky light: 8-15". It
                  is not a list and must not be split: the separators are part of the sentence
                  the workbook author wrote. */}
              <td>{row.conditions || EMPTY}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
