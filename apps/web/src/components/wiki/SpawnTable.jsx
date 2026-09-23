import { BucketBadge } from './BucketBadge.jsx';
import { EMPTY, levelRange, numberOrEmpty } from '../../lib/labels.js';

const COLUMNS = ['Bucket', 'Weight', 'Level', 'Context', 'Biomes', 'Conditions'];

// A real table, because spawn data is genuinely tabular - a card per spawn row would be 46
// cards for Magikarp.
//
// One table for the whole species, with a tbody per form, rather than one table per form.
// Magikarp has 32 distinct forms: a table each meant 32 repeated column headers and a
// 5,700px page. A spanning row inside each tbody names the form and keeps the association
// explicit for a screen reader, which a series of separate tables does not.
export function SpawnTable({ groups }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {COLUMNS.map((column) => <th key={column} scope="col">{column}</th>)}
          </tr>
        </thead>

        {groups.map((group) => (
          <tbody key={group.key}>
            {/* Suppressed for a species with exactly one form: that is not "a form", it is
                just the Pokemon, and printing "Base form" over every ordinary page is
                noise. */}
            {groups.length > 1 ? (
              <tr>
                <th
                  scope="colgroup"
                  colSpan={COLUMNS.length}
                  className={group.label === 'Base form' ? '' : 'mono'}
                  style={{ paddingTop: 18, color: 'var(--text)', textTransform: 'none', letterSpacing: 0, fontSize: '0.9rem' }}
                >
                  {group.label}
                </th>
              </tr>
            ) : null}

            {group.rows.map((row, index) => (
              <tr key={index}>
                <td>{row.bucket ? <BucketBadge bucket={row.bucket} /> : EMPTY}</td>
                <td>{numberOrEmpty(row.weight)}</td>
                <td>{levelRange(row.levelMin, row.levelMax)}</td>
                <td>{row.context ?? EMPTY}</td>
                <td className="mono">
                  {/* 68 of the 112 biome tokens are #-prefixed tags rather than concrete
                      biome names, and six rows carry the literal phrase "Any biome" the
                      workbook author typed. Both are shown exactly as stored. */}
                  {row.biomes?.length ? row.biomes.join(', ') : EMPTY}
                </td>
                {/* conditions is free text served as one string - "Night, Sky light: 8-15".
                    It is not a list and must not be split: the separators are part of the
                    sentence the workbook author wrote. */}
                <td>{row.conditions || EMPTY}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
