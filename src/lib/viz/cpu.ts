import type { Viz } from "./types";

/** Scene for the CPU visualization. */
export type Regs = { PC: string; MAR: string; MDR: string; CIR: string; ACC: string };
export type CpuScene = {
  regs: Regs;
  ram: string[];                 // addresses 0..7
  ramHi?: number;                // address being accessed
  ramKind?: "code" | "data";
  hi?: string[];                 // highlighted parts: PC MAR MDR CIR ACC CU ALU RAM bus-address bus-data bus-control code data
  bus?: { lane: "address" | "data" | "control"; dir: "toRam" | "toCpu"; label: string };
  cu?: string;                   // control unit speech bubble
  alu?: string;                  // ALU working
  stage?: "FETCH" | "DECODE" | "EXECUTE" | null;
  move?: { from: string; to: string; label: string };  // a value travelling between registers
  showPerf?: boolean;
};

const RAM0 = ["LOAD 4", "ADD 5", "STORE 6", "END", "12", "30", "", ""];
const R = (p: Partial<Regs> = {}): Regs => ({ PC: "0", MAR: "", MDR: "", CIR: "", ACC: "", ...p });

export const CPU_VIZ: Viz<CpuScene> = {
  id: "cpu-fde",
  course: "o-computer-science",
  chapter: "3",
  title: "Inside the CPU: von Neumann + Fetch–Decode–Execute",
  emoji: "🧠",
  blurb: "Follow one tiny program through the CPU: registers, buses and every stage of the cycle.",
  steps: [
    {
      title: "Meet the CPU",
      caption: "The CPU (processor) runs programs. Inside: the Control Unit (CU) gives orders, the ALU does maths and logic, and registers are tiny super-fast storage. Buses connect the CPU to memory (RAM).",
      scene: { regs: R(), ram: RAM0, hi: ["CU", "ALU", "PC", "MAR", "MDR", "CIR", "ACC"] },
    },
    {
      title: "Von Neumann: one memory for everything",
      caption: "In the von Neumann (stored program) architecture, the program's INSTRUCTIONS and its DATA are stored together in the same memory. Addresses 0–3 hold instructions; 4–5 hold data.",
      scene: { regs: R(), ram: RAM0, hi: ["RAM", "code", "data"] },
      task: { kind: "choice", prompt: "In von Neumann architecture, where are the program's instructions stored?", options: ["Inside the ALU", "In the same memory as the data", "In a separate memory from the data", "On the keyboard"], answer: 1 },
      why: "Stored program concept: instructions AND data live together in main memory and are fetched one at a time.",
    },
    {
      title: "The Program Counter",
      caption: "The program is loaded. The Program Counter (PC) holds the ADDRESS of the next instruction to fetch. Right now it's 0.",
      scene: { regs: R(), ram: RAM0, hi: [] },
      task: { kind: "tap", prompt: "Tap the register that holds the address of the NEXT instruction.", targets: ["PC", "MAR", "MDR", "CIR", "ACC"], answer: "PC" },
      why: "The PC (Program Counter) always points at the next instruction's address.",
    },
    {
      title: "FETCH ① PC → MAR",
      caption: "Fetch starts: the address in the PC (0) is copied into the MAR (Memory Address Register). The MAR holds the address we want to read.",
      scene: { regs: R({ MAR: "0" }), ram: RAM0, hi: ["PC", "MAR"], stage: "FETCH", move: { from: "PC", to: "MAR", label: "0" } },
      task: { kind: "choice", prompt: "The address is in the MAR. Which bus will carry it to memory?", options: ["Address bus", "Data bus", "Control bus"], answer: 0 },
      why: "Addresses travel on the ADDRESS bus, one way only: from the CPU to memory.",
    },
    {
      title: "FETCH ② Instruction → MDR",
      caption: "The address bus carries 0 to memory. The instruction at address 0 (LOAD 4) comes back to the CPU on the DATA bus and lands in the MDR (Memory Data Register).",
      scene: { regs: R({ MAR: "0", MDR: "LOAD 4" }), ram: RAM0, ramHi: 0, ramKind: "code", hi: ["MAR", "MDR", "bus-address", "bus-data"], stage: "FETCH", bus: { lane: "data", dir: "toCpu", label: "LOAD 4" } },
      task: { kind: "choice", prompt: "The instruction is in the MDR. What happens to the PC now?", options: ["It is reset to 0", "It is incremented to 1", "It is copied into the ALU", "It is cleared"], answer: 1 },
      why: "The PC is incremented (+1) so it points at the NEXT instruction, ready for the next cycle.",
    },
    {
      title: "FETCH ③ PC + 1, MDR → CIR",
      caption: "The PC is incremented to 1. The instruction is copied from the MDR into the CIR (Current Instruction Register), which holds the instruction being worked on.",
      scene: { regs: R({ PC: "1", MAR: "0", MDR: "LOAD 4", CIR: "LOAD 4" }), ram: RAM0, hi: ["PC", "CIR"], stage: "FETCH", move: { from: "MDR", to: "CIR", label: "LOAD 4" } },
    },
    {
      title: "DECODE",
      caption: "The Control Unit decodes the instruction in the CIR: \"LOAD 4\" means \"copy the value stored at address 4 into the ACC\".",
      scene: { regs: R({ PC: "1", MAR: "0", MDR: "LOAD 4", CIR: "LOAD 4" }), ram: RAM0, hi: ["CIR"], stage: "DECODE", cu: "LOAD 4 → fetch the data at address 4 into the ACC" },
      task: { kind: "tap", prompt: "Tap the part of the CPU that DECODES the instruction.", targets: ["CU", "ALU", "PC", "ACC"], answer: "CU" },
      why: "The Control Unit decodes instructions and sends control signals to the other parts.",
    },
    {
      title: "EXECUTE: LOAD 4",
      caption: "Execute: address 4 goes to the MAR, the DATA at address 4 (12) comes back on the data bus into the MDR, then into the ACC (Accumulator). Data and instructions came from the SAME memory.",
      scene: { regs: R({ PC: "1", MAR: "4", MDR: "12", CIR: "LOAD 4", ACC: "12" }), ram: RAM0, ramHi: 4, ramKind: "data", hi: ["MAR", "MDR", "ACC", "bus-data"], stage: "EXECUTE", bus: { lane: "data", dir: "toCpu", label: "12" } },
    },
    {
      title: "Cycle 2: FETCH again",
      caption: "The cycle repeats. PC = 1, so the next instruction, ADD 5, is fetched into the CIR and the PC becomes 2.",
      scene: { regs: R({ PC: "2", MAR: "1", MDR: "ADD 5", CIR: "ADD 5", ACC: "12" }), ram: RAM0, ramHi: 1, ramKind: "code", hi: ["PC", "MAR", "MDR", "CIR"], stage: "FETCH" },
      task: { kind: "order", prompt: "Put the FETCH stage in the right order.", items: ["Address copied from the PC to the MAR", "Address sent to memory on the address bus", "Instruction sent to the MDR on the data bus", "Instruction copied from the MDR to the CIR"], answer: [0, 1, 2, 3] },
      why: "PC → MAR → address bus → memory → data bus → MDR → CIR. (The PC is incremented during fetch too.)",
    },
    {
      title: "DECODE + EXECUTE: ADD 5",
      caption: "Decode: ADD 5 means \"add the value at address 5 to the ACC\". The value 30 is fetched from address 5. Now something has to do the maths…",
      scene: { regs: R({ PC: "2", MAR: "5", MDR: "30", CIR: "ADD 5", ACC: "12" }), ram: RAM0, ramHi: 5, ramKind: "data", hi: ["MDR", "ACC"], stage: "EXECUTE", cu: "ADD 5 → add the data at address 5 to the ACC" },
      task: { kind: "tap", prompt: "Tap the part of the CPU that does the addition.", targets: ["CU", "ALU", "MAR", "PC"], answer: "ALU" },
      why: "The ALU (Arithmetic Logic Unit) does all calculations and logic comparisons.",
    },
    {
      title: "The ALU calculates",
      caption: "The ALU adds 12 + 30 = 42 and the result goes back into the ACC (Accumulator), which holds results of calculations.",
      scene: { regs: R({ PC: "2", MAR: "5", MDR: "30", CIR: "ADD 5", ACC: "42" }), ram: RAM0, hi: ["ALU", "ACC"], stage: "EXECUTE", alu: "12 + 30 = 42" },
    },
    {
      title: "STORE 6: writing to memory",
      caption: "Next cycle: STORE 6 writes the ACC (42) into address 6. The address goes out on the address bus, and the DATA goes out from the CPU to memory on the data bus: the data bus works both ways.",
      scene: { regs: R({ PC: "3", MAR: "6", MDR: "42", CIR: "STORE 6", ACC: "42" }), ram: ["LOAD 4", "ADD 5", "STORE 6", "END", "12", "30", "42", ""], ramHi: 6, ramKind: "data", hi: ["bus-address", "bus-data", "MDR"], stage: "EXECUTE", bus: { lane: "data", dir: "toRam", label: "42" } },
      task: { kind: "choice", prompt: "Why is the ADDRESS bus one-way (unidirectional)?", options: ["Only the CPU sends addresses to memory", "Memory is too slow to send addresses", "Addresses are bigger than data", "It's broken in old computers"], answer: 0 },
      why: "Only the CPU decides WHICH address to use, so addresses only travel CPU → memory. Data can go both ways.",
    },
    {
      title: "Faster CPUs",
      caption: "This fetch–decode–execute cycle repeats billions of times a second. Three things make a CPU faster: clock speed (cycles per second), number of cores (cycles in parallel) and cache size (fast memory close to the CPU).",
      scene: { regs: R({ PC: "4", MAR: "3", MDR: "END", CIR: "END", ACC: "42" }), ram: ["LOAD 4", "ADD 5", "STORE 6", "END", "12", "30", "42", ""], hi: [], showPerf: true },
      task: { kind: "choice", prompt: "Which change lets a CPU carry out MORE fetch–decode–execute cycles per second?", options: ["More RAM", "A higher clock speed", "A bigger monitor", "More USB ports"], answer: 1 },
      why: "Clock speed = number of cycles per second (e.g. 3.5 GHz ≈ 3.5 billion cycles every second).",
    },
  ],
};
