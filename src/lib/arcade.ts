/** Arcade games and where they belong in the courses (so each chapter can show its own games). */
export type Game = { slug: string; ids: string[]; emoji: string; name: string; genre: string; topic: string; blurb: string; where: { course: string; chapters: string[] }[] };

export const ARCADE: Game[] = [
  { slug: "bit-patrol", ids: ["bit-patrol"], emoji: "📡", name: "Bit Patrol", genre: "Puzzle", topic: "Data transmission · parity · error checks",
    blurb: "Guard a data link: spot corrupted bytes with parity checks, set parity bits, and name each transmission method.", where: [{ course: "o-computer-science", chapters: ["2"] }] },
  { slug: "cyber-defender", ids: ["cyber-defender"], emoji: "🛡️", name: "Cyber Defender", genre: "Detective", topic: "Internet · cyber threats · protection",
    blurb: "Run the security desk: spot scam messages, name threats and protections, and know your DNS from your HTTPS.", where: [{ course: "o-computer-science", chapters: ["5"] }] },
  { slug: "control-room", ids: ["control-room"], emoji: "🎛️", name: "Control Room", genre: "Builder", topic: "Automated systems · sensors · actuators",
    blurb: "Build automated systems: pick the right sensor and actuator for greenhouses, alarms, barriers and more.", where: [{ course: "o-computer-science", chapters: ["6"] }] },
  { slug: "order-race", ids: ["order-race"], emoji: "🏁", name: "Order Race 1v1", genre: "Versus", topic: "Processes in the right order",
    blurb: "Challenge a friend: PC → MAR → MDR → CIR, packet switching, DNS lookups… Fastest correct order wins.",
    where: [{ course: "o-computer-science", chapters: ["1", "2", "3", "4", "5", "6", "7"] }] },
  { slug: "trace-master", ids: ["trace-o", "trace-as", "trace-a", "trace-pro"], emoji: "🧮", name: "Trace Master", genre: "Brain", topic: "Pseudocode · trace tables",
    blurb: "Be the computer: run pseudocode line by line and fill in the trace table. O Level, AS and A Level modes.",
    where: [{ course: "o-computer-science", chapters: ["7", "8"] }, { course: "as-computer-science", chapters: ["9", "10", "11"] }, { course: "a-computer-science", chapters: ["19", "20"] }] },
  { slug: "ip-blaster", ids: ["ip-blaster-v4", "ip-blaster-v6"], emoji: "🎯", name: "IP Blaster", genre: "Shooter", topic: "IP addresses · IPv4 vs IPv6",
    blurb: "Shoot the valid IP addresses, dodge the fakes. Rookie (IPv4) or Elite (IPv6) mode.", where: [{ course: "o-computer-science", chapters: ["3"] }] },
  { slug: "cpu-commander", ids: ["cpu-commander"], emoji: "🤖", name: "CPU Commander", genre: "Puzzle", topic: "Instruction sets · fetch–decode–execute",
    blurb: "Program a tiny CPU using only its instruction set. Watch every fetch, decode and execute.", where: [{ course: "o-computer-science", chapters: ["3"] }] },
  { slug: "embedded-sorter", ids: ["embedded-sorter"], emoji: "🏭", name: "Embedded Sorter", genre: "Arcade", topic: "Embedded systems",
    blurb: "Sort devices on a speeding factory belt: embedded or general-purpose?", where: [{ course: "o-computer-science", chapters: ["3"] }] },
];

export const gamesFor = (course: string, chapter: string) => ARCADE.filter((g) => g.where.some((w) => w.course === course && w.chapters.includes(chapter)));
export const gamesForCourse = (course: string) => ARCADE.filter((g) => g.where.some((w) => w.course === course));
