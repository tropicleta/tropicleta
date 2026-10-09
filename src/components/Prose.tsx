/** Renderiza texto simple: párrafos separados por línea en blanco, "## " = subtítulo, "- " = lista. */
export function Prose({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/).flatMap(block => {
    const lines = block.split("\n");
    return lines[0].startsWith("## ") && lines.length > 1
      ? [lines[0], lines.slice(1).join("\n")]
      : [block];
  });
  return (
    <div className="tp-prose">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines[0].startsWith("## ")) {
          return (
            <div key={i}>
              <h2>{lines[0].slice(3)}</h2>
              {lines.slice(1).join(" ").trim() && <p>{lines.slice(1).join(" ")}</p>}
            </div>
          );
        }
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l) => (
                <li key={l}>{l.slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{b}</p>;
      })}
    </div>
  );
}
