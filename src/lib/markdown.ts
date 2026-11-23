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
  for (const line of lines) {
    if (line.trim().startsWith("```")) { close(); out.push(code ? "</code></pre>" : "<pre><code>"); code = !code; continue; }
    if (code) { out.push(line + "\n"); continue; }
    let m;
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) { close(); const l = m[1].length + 1; out.push(`<h${l}>${inline(m[2])}</h${l}>`); continue; }
    if ((m = line.match(/^\s*[-*]\s+(.*)$/))) { if (list !== "ul") { close(); out.push("<ul>"); list = "ul"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== "ol") { close(); out.push("<ol>"); list = "ol"; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if (line.startsWith("&gt; ")) { close(); out.push(`<blockquote>${inline(line.slice(5))}</blockquote>`); continue; }
    if (!line.trim()) { close(); continue; }
    close();
    out.push(`<p>${inline(line)}</p>`);
  }
  close();
  if (code) out.push("</code></pre>");
  return out.join("\n");
}
