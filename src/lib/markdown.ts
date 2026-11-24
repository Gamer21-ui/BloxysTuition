/**
 * Tiny, safe Markdown renderer for tutor notes: everything is HTML-escaped first,
 * then a small set of formatting rules is applied. No raw HTML is ever passed through.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(src: string) {
  const lines = esc(src || "").split(/\r?\n/);
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let code = false;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  let table: string[][] | null = null;
  let codeLines: string[] = [];
  const flushTable = () => {
    if (!table) return;
    const [head, ...body] = table;
    out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    table = null;
  };
  for (const line of lines) {
    // simple pipe tables: | a | b |, with an optional |---|---| separator row
    if (!code && /^\s*\|.*\|\s*$/.test(line)) {
      close();
      const cells = line.trim().slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      (table ??= []).push(cells);
      continue;
    }
    flushTable();
    if (line.trim().startsWith("```")) {
      close();
      if (code) { out.push(`<pre><code>${codeLines.join("\n")}</code></pre>`); codeLines = []; }
      code = !code;
      continue;
    }
    if (code) { codeLines.push(line); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { close(); const l = m[1].length + 1; out.push(`<h${l}>${inline(m[2])}</h${l}>`); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if (line.startsWith("&gt; ")) { close(); out.push(`<blockquote>${inline(line.slice(5))}</blockquote>`); continue; }
    if (!line.trim()) { close(); continue; }
    close();
    out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  close();
  if (code) out.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
  return out.join("\n");
}
