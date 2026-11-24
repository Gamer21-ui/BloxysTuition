// Original pixel-art accessories for the blocky avatar (shop items). Each item is a small grid of
// characters; "." is transparent and every other character maps to a colour in its palette.
// The avatar is drawn in a 100×100 box: head x29–71 / y14–56, eyes around y30–38, body below y56.
import type { ReactNode } from "react";

type Pal = Record<string, string>;
const mirror = (rows: string[]) => rows.map((r) => [...r].reverse().join(""));

export function Px({ x, y, s = 3, rows, pal, opacity }: { x: number; y: number; s?: number; rows: string[]; pal: Pal; opacity?: number }) {
  const out: ReactNode[] = [];
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch !== "." && pal[ch]) out.push(<rect key={`${i}-${j}`} x={x + i * s} y={y + j * s} width={s + 0.05} height={s + 0.05} fill={pal[ch]} />);
  }));
  return <g shapeRendering="crispEdges" opacity={opacity}>{out}</g>;
}

// ---------------------------------------------------------------- hats
export const PIXEL_HATS: Record<string, () => ReactNode> = {
  fedora: () => <Px x={23} y={4} pal={{ K: "#111827", P: "#ec4899", Y: "#fde047" }} rows={[
    "Y.....KKKKKK....Y.", "......KKKKKKKK.Y..", ".Y..KKKKKKKKKK....", "....PPPPPPPPPP....", "KKKKKKKKKKKKKKKKKK", ".KKKKKKKKKKKKKKKK."]} />,
  horns: () => <Px x={26} y={2} pal={{ R: "#b91c1c", O: "#f97316", Y: "#fde047" }} rows={[
    "R..............R", "RO............OR", ".RO..........OR.", ".ROO........OOR.", "..RYO......OYR..", "..RRY......YRR.."]} />,
  frost_crown: () => <Px x={29} y={6} pal={{ B: "#7dd3fc", I: "#f0f9ff", W: "#0284c7" }} rows={[
    "I....I..I....I", "BB..BBBBBB..BB", "BIBBBIBBIBBBIB", "BBBBBBBBBBBBBB", "WWWWWWWWWWWWWW"]} />,
  neon_phones: () => <Px x={20} y={4} pal={{ P: "#a855f7", C: "#22d3ee", D: "#0e7490" }} rows={[
    "......PPPPPPPP......", "....PP........PP....", "...P............P...", "..P..............P..", "..P..............P..", ".P................P.",
    ".P................P.", "CCC..............CCC", "CDC..............CDC", "CDC..............CDC", "CCC..............CCC", ".C................C."]} />,
  bunny: () => <Px x={29} y={0} pal={{ W: "#f8fafc", P: "#f9a8d4", G: "#cbd5e1" }} rows={[
    "..WW......WW..", ".WPW......WPW.", ".WPW......WPW.", ".WPG......WPG.", ".WPW......WPW.", "..WW......WW.."]} />,
  mushroom: () => <Px x={26} y={3} pal={{ R: "#ef4444", W: "#fff7ed", D: "#b91c1c" }} rows={[
    ".....RRRRRR.....", "...RRWWRRRRRR...", "..RRRWWRRRWWRR..", ".RRRRRRRRRWWRRR.", "RRWWRRRRRRRRRRRR", "DDWWDDDDDWWDDDDD"]} />,
  tricorn: () => <Px x={23} y={4} pal={{ K: "#111827", Y: "#facc15", W: "#f8fafc" }} rows={[
    ".......KKKK.......", ".....KKKWWKKK.....", "Y..KKKKWWWWKKKK..Y", "YKKKKKKKWWKKKKKKKY", ".YYKKKKKKKKKKKKYY.", "...YYYYYYYYYYYY..."]} />,
  kabuto: () => <Px x={23} y={0} pal={{ R: "#991b1b", K: "#1f2937", Y: "#facc15" }} rows={[
    "..Y............Y..", "...Y..........Y...", "....Y........Y....", ".....YY.RR.YY.....", "....RRRRRRRRRR....", "...RRRRRRRRRRRR...",
    "KKKKKKKKKKKKKKKKKK", "K.KKKKKKKKKKKKKK.K", "K................K"]} />,
  astronaut: () => (
    <g>
      <rect x="26" y="11" width="48" height="45" rx="10" fill="#93c5fd" opacity="0.22" />
      <Px x={23} y={8} pal={{ G: "#e2e8f0", S: "#94a3b8", H: "#ffffff", W: "#f8fafc", B: "#3b82f6" }} rows={[
        ".....GGGGGGGG.....", "...GG........GG...", "..G..HH........G..", ".G..H............G", "G..H.............G", "G................G",
        "G................G", "G................G", "G................G", "G................G", "G................G", "G................G",
        "G................G", ".G..............G.", "..GG..........GG..", "WWWWWWWBBWWWWWWWWW", "SSSSSSSSSSSSSSSSSS"]} />
    </g>
  ),
};

// ---------------------------------------------------------------- face accessories
export const PIXEL_FACE: Record<string, () => ReactNode> = {
  shades: () => <Px x={29} y={28} pal={{ K: "#0f172a", W: "#e2e8f0" }} rows={["KKKKKKKKKKKKKK", ".KKKWK..KKKWK.", ".KKKKK..KKKKK.", "..KKK....KKK.."]} />,
  nerd: () => <Px x={29} y={28} pal={{ K: "#1f2937", L: "#bfdbfe" }} rows={[".KKKKK..KKKKK.", "KK...KKKK...KK", ".K...K..K...K.", ".KKKKK..KKKKK."]} />,
  eyepatch: () => <Px x={29} y={26} pal={{ K: "#111827" }} rows={["KKKKKKKKKKKKKK", ".........KKKK.", ".........KKKK.", ".........KKKK.", "..........KK.."]} />,
  monocle: () => <Px x={29} y={27} pal={{ Y: "#eab308" }} rows={[".........YYY..", "........Y...Y.", "........Y...Y.", ".........YYY..", "..........Y...", "...........Y..", "............Y."]} />,
  laser_visor: () => (
    <g>
      <rect x="27" y="26" width="46" height="13" fill="#ef4444" opacity="0.35" />
      <Px x={29} y={29} pal={{ R: "#b91c1c", G: "#fecaca", W: "#ffffff" }} rows={["RRRRRRRRRRRRRR", "RGGWGGGGGGWGGR", "RRRRRRRRRRRRRR"]} />
    </g>
  ),
};

// ---------------------------------------------------------------- back items (drawn behind the body)
const ANGEL = ["......WWW", "....WWWWW", "..WWWWWWW", ".WWWWWWWW", "WWWWWWWWW", "WWWWWWWGW", ".WWWWWWGG", ".WWWWWGGG", "..WWWGGGG", "...WGGGG.", "....GGG..", ".....G..."];
const DEMON = ["K........", "KK.......", "KPK......", "KPPK.....", "KPPPKK...", "KPRPPPKKK", "KPPRPPPPK", "KPPPRPPPK", ".KPPPRPPK", "..KPK.KPK", "...K...K."];
const FLY = ["...BBB...", ".BBCCCB..", "BCCPPCCB.", "BCPPPPCB.", "BCCPPCCBB", ".BCCCCBBB", "..BBBB.BB", "...BCCB..", "..BCPPCB.", "..BCPPCB.", "...BBBB.."];
const pair = (rows: string[], pal: Pal, y: number, s = 3.4) => {
  const w = rows[0].length * s;
  return <g><Px x={30 - w} y={y} s={s} rows={rows} pal={pal} /><Px x={70} y={y} s={s} rows={mirror(rows)} pal={pal} /></g>;
};

export const PIXEL_BACK: Record<string, () => ReactNode> = {
  angel_wings: () => pair(ANGEL, { W: "#f8fafc", G: "#cbd5e1" }, 20),
  demon_wings: () => pair(DEMON, { K: "#1e1b4b", P: "#7e22ce", R: "#dc2626" }, 20),
  butterfly: () => pair(FLY, { B: "#0f172a", C: "#22d3ee", P: "#f472b6" }, 22),
  cape: () => <Px x={11} y={54} pal={{ R: "#dc2626", D: "#991b1b", Y: "#facc15" }} rows={[
    ".....YRRRRRRRRRRRRRRY.....", ".....RRRRRRRRRRRRRRRR.....", "....RRRRRRRRRRRRRRRRRR....", "....RRDRRRRRRRRRRRRDRR....",
    "...RRRDRRRRRRRRRRRRDRRR...", "...RRRDRRRRRRRRRRRRDRRR...", "..RRRRDRRRRRRRRRRRRDRRRR..", "..RRRRDRRRRRRRRRRRRDRRRR..",
    ".RRRRRDRRRRRRRRRRRRDRRRRR.", ".RRRRRDRRRRRRRRRRRRDRRRRR.", "RRRRRRDRRRRRRRRRRRRDRRRRRR", "RRRRRRDRRRRRRRRRRRRDRRRRRR",
    "RRDRRRDRRRRRRRRRRRRDRRRDRR", "RRDRRRDRRRRRRRRRRRRDRRRDRR", "R.D.R.D.R.R.RR.R.R.D.R.D.R"]} />,
  blade: () => <Px x={58} y={24} pal={{ S: "#cbd5e1", L: "#f8fafc", Y: "#facc15", B: "#78350f" }} rows={[
    "..........SS", ".........SLS", "........SLS.", ".......SLS..", "......SLS...", ".....SLS....", "....SLS.....", "...SLS......", ".YYSS.......", ".YYY........", "BY.Y........", "B..........."]} />,
  jetpack: () => <Px x={8} y={52} pal={{ G: "#94a3b8", D: "#475569", O: "#f97316", Y: "#facc15", R: "#ef4444" }} rows={[
    ".GG......................GG.", "GGGG....................GGGG", "GDDG....................GDDG", "GGGG....................GGGG", "GRRG....................GRRG",
    "GGGG....................GGGG", "GDDG....................GDDG", "GGGG....................GGGG", ".DD......................DD.", ".OO......................OO.",
    ".YO......................OY.", "..Y......................Y..", ".Y........................Y."]} />,
  shadow_aura: () => (
    <g>
      <defs><radialGradient id="fb-aura" cx="50%" cy="55%" r="55%"><stop offset="0.35" stopColor="#7c3aed" stopOpacity="0.85" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="50" cy="58" rx="46" ry="44" fill="url(#fb-aura)" />
      <Px x={6} y={10} s={3} pal={{ P: "#c4b5fd", D: "#4c1d95" }} rows={[
        "P.........................P", "...D.................D.....", "...........................", "D........................D.", "...........................",
        ".....P...............P.....", "...........................", "P.........................P", "...........................", "..D...................D....",
        "...........................", "...........................", ".P.......................P.", "...........................", "....D...............D......"]} />
    </g>
  ),
};
