import { Download, ExternalLink, FileText, Video } from "lucide-react";

type R = { id: string; title: string; kind: string; file_path: string | null; url: string | null; section: string };

export function ResourceList({ items, empty }: { items: R[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-2">
      {items.map((r) => {
        const href = r.file_path ? `/api/files?bucket=resources&path=${encodeURIComponent(r.file_path)}` : r.url || "#";
        const Ico = r.kind === "video" ? Video : r.file_path ? FileText : ExternalLink;
        return (
          <li key={r.id}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border-2 border-line bg-surface2 px-3 py-2.5 font-bold hover:border-accent" style={{ borderRadius: "calc(var(--radius)*.6)" }}>
              <Ico size={18} className="shrink-0 text-accent" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{r.title}</span>
              {r.file_path && <Download size={16} className="text-muted" aria-label="Download" />}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
