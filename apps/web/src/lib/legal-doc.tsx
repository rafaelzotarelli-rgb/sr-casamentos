import 'server-only';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';

// Os textos legais vivem em docs/legal/*.md (fonte única para revisão jurídica).
const LEGAL_DIR = join(process.cwd(), '../../docs/legal');

export async function readLegalDoc(name: 'privacidade' | 'termos'): Promise<string> {
  return readFile(join(LEGAL_DIR, `${name}.md`), 'utf8');
}

/** Negrito com **texto**. */
function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

const cells = (line: string) =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

/** Markdown mínimo: títulos, citações, listas, tabelas e parágrafos. */
export function LegalMarkdown({ source }: { source: string }) {
  const blocks = source.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.trim().split('\n');
        const first = lines[0] ?? '';
        if (first.startsWith('# ')) return <h1 key={i}>{first.slice(2)}</h1>;
        if (first.startsWith('## ')) return <h2 key={i}>{first.slice(3)}</h2>;
        if (first.startsWith('> ')) {
          return (
            <p key={i} className="alert">
              {inline(lines.map((l) => l.replace(/^> ?/, '')).join(' '))}
            </p>
          );
        }
        if (first.startsWith('- ')) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.replace(/^- /, ''))}</li>
              ))}
            </ul>
          );
        }
        if (first.startsWith('|')) {
          const [head, , ...rows] = lines;
          return (
            <table key={i}>
              <thead>
                <tr>
                  {cells(head ?? '').map((c, j) => (
                    <th key={j}>{inline(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, j) => (
                  <tr key={j}>
                    {cells(row).map((c, k) => (
                      <td key={k}>{inline(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        return <p key={i}>{inline(lines.join(' '))}</p>;
      })}
    </>
  );
}
