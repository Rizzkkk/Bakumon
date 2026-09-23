// The summary box: a caption bar, an art tile, then a <th scope="row">/<td> table.
// `rows` is [{ label, value }] - value is any renderable node, not just text, since several
// rows hold BucketChip lists or links rather than plain strings.
//
// `title` must stay a plain string - it feeds the aria-label, and a React element there
// renders as "[object Object]" for assistive tech. `caption` is the visible bar content and
// defaults to `title`; ItemDetail passes an ItemName element there so the %s placeholder
// chip still renders in the box while the aria-label keeps the raw stored name.
export function Infobox({ title, caption = title, art, rows }) {
  return (
    <aside aria-label={`${title} at a glance`} className="infobox">
      <div className="infobox__caption">{caption}</div>
      <div className="infobox__art">{art}</div>
      <table>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
