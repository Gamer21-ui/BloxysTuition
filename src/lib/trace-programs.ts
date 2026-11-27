/**
 * Trace Master programs for everyone: O Level (0478-style pseudocode) and AS / A Level (9618-style).
 * Exclusive "Pro" programs live in trace-pro.ts (server-only).
 */
import { program, type TraceSet } from "./trace";

// ------------------------------------------------------------------ O Level (0478 pseudocode)
const O = [
  program({
    id: "o-total", title: "Running total", topic: "FOR loops · totalling",
    vars: ["Count", "Total"],
    code: `
DECLARE Total : INTEGER
DECLARE Count : INTEGER
Total ← 0
FOR Count ← 1 TO 4
    Total ← Total + Count
NEXT Count
OUTPUT Total`,
    run: (t) => {
      let total = t.set("Total", 0, "Total ← 0", false) as number;
      for (let c = 1; c <= 4; c++) { t.set("Count", c, "FOR Count", c > 1); total = t.set("Total", total + c, "Total ← Total + Count", true, `Total + Count = ${total} + ${c}`) as number; }
      t.out(total, "OUTPUT Total");
    },
  }),
  program({
    id: "o-halve", title: "Keep halving", topic: "WHILE loops · DIV",
    vars: ["Num", "Steps"],
    code: `
DECLARE Num : INTEGER
DECLARE Steps : INTEGER
Num ← 50
Steps ← 0
WHILE Num > 1 DO
    Num ← DIV(Num, 2)
    Steps ← Steps + 1
ENDWHILE
OUTPUT Steps`,
    run: (t) => {
      let n = t.set("Num", 50, "Num ← 50", false) as number;
      let s = t.set("Steps", 0, "Steps ← 0", false) as number;
      while (n > 1) {
        const before = n;
        n = t.set("Num", Math.floor(n / 2), "Num ← DIV", true, `DIV(${before}, 2) = ${Math.floor(before / 2)} (DIV drops the remainder)`, [before / 2]) as number;
        s = t.set("Steps", s + 1, "Steps ← Steps + 1") as number;
      }
      t.out(s, "OUTPUT Steps", true);
    },
  }),
  program({
    id: "o-max", title: "Find the highest", topic: "Arrays · finding the maximum",
    vars: ["Index", "Max"],
    code: `
// Num[1:5] holds 3, 8, 5, 12, 7
DECLARE Num : ARRAY[1:5] OF INTEGER
DECLARE Max : INTEGER
DECLARE Index : INTEGER
Max ← Num[1]
FOR Index ← 2 TO 5
    IF Num[Index] > Max THEN
        Max ← Num[Index]
    ENDIF
NEXT Index
OUTPUT Max`,
    run: (t) => {
      const num = [0, 3, 8, 5, 12, 7];
      let max = t.set("Max", num[1], "Max ← Num[1]", true, "Max starts as the FIRST element, Num[1] = 3") as number;
      for (let i = 2; i <= 5; i++) {
        t.set("Index", i, "FOR Index", false);
        if (num[i] > max) max = t.set("Max", num[i], "Max ← Num[Index]", true, `Num[${i}] = ${num[i]} is bigger than ${max}`) as number;
      }
      t.out(max, "OUTPUT Max");
    },
  }),
  program({
    id: "o-evens", title: "Count the evens", topic: "MOD · counting",
    vars: ["Index", "Evens"],
    code: `
// Num[1:5] holds 4, 7, 2, 9, 6
DECLARE Num : ARRAY[1:5] OF INTEGER
DECLARE Evens : INTEGER
DECLARE Index : INTEGER
Evens ← 0
FOR Index ← 1 TO 5
    IF MOD(Num[Index], 2) = 0 THEN
        Evens ← Evens + 1
    ENDIF
NEXT Index
OUTPUT Evens`,
    run: (t) => {
      const num = [0, 4, 7, 2, 9, 6];
      let e = t.set("Evens", 0, "Evens ← 0", false) as number;
      for (let i = 1; i <= 5; i++) {
        t.set("Index", i, "FOR Index", i > 1);
        if (num[i] % 2 === 0) e = t.set("Evens", e + 1, "Evens ← Evens + 1", true, `MOD(${num[i]}, 2) = 0, so ${num[i]} is even`) as number;
      }
      t.out(e, "OUTPUT Evens");
    },
  }),
  program({
    id: "o-letters", title: "Spot the O", topic: "Strings · SUBSTRING · LENGTH",
    vars: ["Index", "Letter", "Count"],
    code: `
DECLARE Word : STRING
DECLARE Letter : CHAR
DECLARE Count : INTEGER
DECLARE Index : INTEGER
Word ← "ROBLOX"
Count ← 0
FOR Index ← 1 TO LENGTH(Word)
    Letter ← SUBSTRING(Word, Index, 1)
    IF Letter = "O" THEN
        Count ← Count + 1
    ENDIF
NEXT Index
OUTPUT Count`,
    run: (t) => {
      const w = "ROBLOX";
      let c = t.set("Count", 0, "Count ← 0", false) as number;
      for (let i = 1; i <= w.length; i++) {
        t.set("Index", i, "FOR Index", false);
        t.set("Letter", w[i - 1], "Letter ← SUBSTRING", true, `SUBSTRING("ROBLOX", ${i}, 1) is character number ${i}`, ["R", "O", "B", "L", "X"].filter((x) => x !== w[i - 1]));
        if (w[i - 1] === "O") c = t.set("Count", c + 1, "Count ← Count + 1") as number;
      }
      t.out(c, "OUTPUT Count");
    },
  }),
  program({
    id: "o-countdown", title: "Countdown", topic: "REPEAT … UNTIL",
    vars: ["X"],
    code: `
DECLARE X : INTEGER
X ← 3
REPEAT
    OUTPUT X
    X ← X - 1
UNTIL X = 0
OUTPUT "Lift off!"`,
    run: (t) => {
      let x = t.set("X", 3, "X ← 3", false) as number;
      do { t.out(x, "OUTPUT X"); x = t.set("X", x - 1, "X ← X - 1") as number; } while (x !== 0);
      t.out("Lift off!", 'OUTPUT "Lift off!"', true);
    },
  }),
];

// ------------------------------------------------------------------ AS Level (9618 pseudocode)
const AS = [
  program({
    id: "as-digits", title: "Digit sum", topic: "MOD · DIV · WHILE",
    vars: ["Num", "Digit", "Sum"],
    code: `
DECLARE Num, Digit, Sum : INTEGER
Num ← 4071
Sum ← 0
WHILE Num > 0
    Digit ← Num MOD 10
    Sum ← Sum + Digit
    Num ← Num DIV 10
ENDWHILE
OUTPUT Sum`,
    run: (t) => {
      let n = t.set("Num", 4071, "Num ← 4071", false) as number;
      let s = t.set("Sum", 0, "Sum ← 0", false) as number;
      while (n > 0) {
        const d = t.set("Digit", n % 10, "Digit ← Num MOD 10", true, `${n} MOD 10 = ${n % 10} (the last digit)`) as number;
        s = t.set("Sum", s + d, "Sum ← Sum + Digit") as number;
        n = t.set("Num", Math.floor(n / 10), "Num ← Num DIV 10", true, `${n} DIV 10 = ${Math.floor(n / 10)} (chops off the last digit)`) as number;
      }
      t.out(s, "OUTPUT Sum");
    },
  }),
  program({
    id: "as-reverse", title: "Reverse a string", topic: "MID · LENGTH · STEP -1",
    vars: ["i", "Rev"],
    code: `
DECLARE Word, Rev : STRING
DECLARE i : INTEGER
Word ← "CODE"
Rev ← ""
FOR i ← LENGTH(Word) TO 1 STEP -1
    Rev ← Rev & MID(Word, i, 1)
NEXT i
OUTPUT Rev`,
    run: (t) => {
      const w = "CODE"; let r = "";
      for (let i = w.length; i >= 1; i--) {
        t.set("i", i, "FOR i", i < w.length, i === w.length ? undefined : "STEP -1 counts DOWN");
        r = t.set("Rev", r + w[i - 1], "Rev ← Rev & MID", true, `& joins strings: "${r}" & "${w[i - 1]}"`, [w[i - 1] + r]) as string;
      }
      t.out(r, "OUTPUT Rev");
    },
  }),
  program({
    id: "as-search", title: "Linear search", topic: "Searching · Boolean flag",
    vars: ["Index", "Found"],
    code: `
// Names[1:4] holds "Ali", "Zara", "Tom", "Mia"
DECLARE Found : BOOLEAN
DECLARE Index : INTEGER
Target ← "Tom"
Found ← FALSE
Index ← 1
WHILE Found = FALSE AND Index <= 4
    IF Names[Index] = Target THEN
        Found ← TRUE
    ELSE
        Index ← Index + 1
    ENDIF
ENDWHILE
OUTPUT Index`,
    run: (t) => {
      const names = ["", "Ali", "Zara", "Tom", "Mia"];
      let found = t.set("Found", false, "Found ← FALSE", false) as boolean;
      let i = t.set("Index", 1, "Index ← 1", false) as number;
      while (!found && i <= 4) {
        if (names[i] === "Tom") found = t.set("Found", true, "Found ← TRUE", true, `Names[${i}] = "Tom", the target`) as boolean;
        else i = t.set("Index", i + 1, "Index ← Index + 1", true, `Names[${i}] = "${names[i]}" is not "Tom"`) as number;
      }
      t.out(i, "OUTPUT Index", true);
    },
  }),
  program({
    id: "as-bubble", title: "One bubble sort pass", topic: "Bubble sort · swapping with Temp",
    vars: ["j", "Temp", "Arr[1]", "Arr[2]", "Arr[3]", "Arr[4]"],
    code: `
// Arr[1:4] holds 5, 1, 4, 2
DECLARE j, Temp : INTEGER
FOR j ← 1 TO 3
    IF Arr[j] > Arr[j + 1] THEN
        Temp ← Arr[j]
        Arr[j] ← Arr[j + 1]
        Arr[j + 1] ← Temp
    ENDIF
NEXT j`,
    run: (t) => {
      const a = [0, 5, 1, 4, 2];
      for (let j = 1; j <= 3; j++) {
        t.set("j", j, "FOR j", false);
        if (a[j] > a[j + 1]) {
          const tmp = t.set("Temp", a[j], "Temp ← Arr[j]", true, `Temp saves Arr[${j}] so it isn't lost`) as number;
          a[j] = t.set(`Arr[${j}]`, a[j + 1], "Arr[j] ← Arr[j + 1]") as number;
          a[j + 1] = t.set(`Arr[${j + 1}]`, tmp, "Arr[j + 1] ← Temp", true, "the saved value goes into the next slot") as number;
        }
      }
    },
  }),
  program({
    id: "as-function", title: "Calling a function", topic: "Functions · BYVAL · RETURN",
    vars: ["i", "N", "Total"],
    code: `
FUNCTION Square(BYVAL N : INTEGER) RETURNS INTEGER
    RETURN N * N
ENDFUNCTION

DECLARE Total, i : INTEGER
Total ← 0
FOR i ← 1 TO 3
    Total ← Total + Square(i)
NEXT i
OUTPUT Total`,
    run: (t) => {
      let tot = t.set("Total", 0, "Total ← 0", false) as number;
      for (let i = 1; i <= 3; i++) {
        t.set("i", i, "FOR i", false);
        t.set("N", i, "FUNCTION Square", i > 1, "the parameter N gets a COPY of i (BYVAL)");
        tot = t.set("Total", tot + i * i, "Total ← Total + Square(i)", true, `Square(${i}) returns ${i * i}`, [tot + i, tot + 2 * i]) as number;
      }
      t.out(tot, "OUTPUT Total");
    },
  }),
  program({
    id: "as-nested", title: "Nested loops", topic: "Nested FOR loops",
    vars: ["Row", "Col", "Count"],
    code: `
DECLARE Row, Col, Count : INTEGER
Count ← 0
FOR Row ← 1 TO 3
    FOR Col ← 1 TO Row
        Count ← Count + 1
    NEXT Col
NEXT Row
OUTPUT Count`,
    run: (t) => {
      let c = t.set("Count", 0, "Count ← 0", false) as number;
      for (let r = 1; r <= 3; r++) {
        t.set("Row", r, "FOR Row", r > 1);
        for (let k = 1; k <= r; k++) { t.set("Col", k, "FOR Col", k > 1, `the inner loop runs 1 TO Row (= ${r})`); c = t.set("Count", c + 1, "Count ← Count + 1", false) as number; }
      }
      t.out(c, "OUTPUT Count", true);
    },
  }),
];

// ------------------------------------------------------------------ A Level (9618 pseudocode, Paper 3/4 topics)
const A = [
  program({
    id: "a-fact", title: "Recursive factorial", topic: "Recursion · base case · unwinding",
    vars: ["Call", "N", "Returns"],
    code: `
FUNCTION Fact(N : INTEGER) RETURNS INTEGER
    IF N = 1 THEN
        RETURN 1
    ELSE
        RETURN N * Fact(N - 1)
    ENDIF
ENDFUNCTION

OUTPUT Fact(4)`,
    run: (t) => {
      // Call = which copy of Fact is running. Calls go down (N = 4, 3, 2, 1), RETURNs come back up.
      for (let n = 4; n >= 1; n--) {
        const call = 5 - n;
        t.set("Call", call, n === 4 ? "FUNCTION Fact" : "RETURN N * Fact", false);
        if (n === 4) t.set("N", n, "FUNCTION Fact", false);
        else t.ask("N", n, "FUNCTION Fact", `Call ${call - 1} has N = ${n + 1}, which isn't 1, so it calls Fact(N - 1). What is N in call ${call}?`,
          n === 1 ? "N = 1 is the BASE CASE: no more calls" : "each call passes N - 1");
      }
      let r = 1;
      t.ask("Returns", 1, "RETURN 1", "Call 4: N = 1, so the IF is TRUE (the base case). What does call 4 return?", "the base case returns 1");
      for (let n = 2; n <= 4; n++) {
        const call = 5 - n;
        t.set("Call", call, "RETURN N * Fact", false);
        r = t.ask("Returns", n * r, "RETURN N * Fact", `Back in call ${call} (N = ${n}): it gets ${r} from call ${call + 1}, then works out N * that. What does call ${call} return?`, `unwinding: ${n} × ${r}`) as number;
      }
      t.out(r, "OUTPUT Fact(4)");
    },
  }),
  program({
    id: "a-binary", title: "Binary search", topic: "Binary search · Low / Mid / High",
    vars: ["Low", "High", "Mid", "Found"],
    code: `
// Arr[1:7] holds 3, 8, 12, 19, 25, 31, 40   (sorted!)
Target ← 25
Low ← 1
High ← 7
Found ← FALSE
WHILE Found = FALSE AND Low <= High
    Mid ← (Low + High) DIV 2
    IF Arr[Mid] = Target THEN
        Found ← TRUE
    ELSE
        IF Arr[Mid] < Target THEN
            Low ← Mid + 1
        ELSE
            High ← Mid - 1
        ENDIF
    ENDIF
ENDWHILE
OUTPUT Mid`,
    run: (t) => {
      const a = [0, 3, 8, 12, 19, 25, 31, 40];
      let lo = t.set("Low", 1, "Low ← 1", false) as number;
      let hi = t.set("High", 7, "High ← 7", false) as number;
      let f = t.set("Found", false, "Found ← FALSE", false) as boolean;
      let mid = 0;
      while (!f && lo <= hi) {
        mid = t.set("Mid", Math.floor((lo + hi) / 2), "Mid ← (Low + High) DIV 2", true, `(${lo} + ${hi}) DIV 2`) as number;
        if (a[mid] === 25) f = t.set("Found", true, "Found ← TRUE", true, `Arr[${mid}] = 25`) as boolean;
        else if (a[mid] < 25) lo = t.set("Low", mid + 1, "Low ← Mid + 1", true, `Arr[${mid}] = ${a[mid]} is too small, search the right half`) as number;
        else hi = t.set("High", mid - 1, "High ← Mid - 1", true, `Arr[${mid}] = ${a[mid]} is too big, search the left half`) as number;
      }
      t.out(mid, "OUTPUT Mid");
    },
  }),
  program({
    id: "a-stack", title: "Stack push & pop", topic: "Stacks · TopPointer",
    vars: ["i", "TopPointer", "Stack[1]", "Stack[2]", "Stack[3]", "Item"],
    code: `
DECLARE Stack : ARRAY[1:5] OF INTEGER
DECLARE TopPointer, i, Item : INTEGER
TopPointer ← 0
FOR i ← 1 TO 3
    TopPointer ← TopPointer + 1
    Stack[TopPointer] ← i * 10
NEXT i
Item ← Stack[TopPointer]
TopPointer ← TopPointer - 1
OUTPUT Item`,
    run: (t) => {
      let tp = t.set("TopPointer", 0, "TopPointer ← 0", false) as number;
      const st = [0];
      for (let i = 1; i <= 3; i++) {
        t.set("i", i, "FOR i", false);
        tp = t.set("TopPointer", tp + 1, "TopPointer ← TopPointer + 1", true, "PUSH: move the pointer up first") as number;
        st[tp] = t.set(`Stack[${tp}]`, i * 10, "Stack[TopPointer] ← i * 10", i > 1) as number;
      }
      const item = t.set("Item", st[tp], "Item ← Stack[TopPointer]", true, "POP takes the TOP item (last in, first out)", [10]) as number;
      t.set("TopPointer", tp - 1, "TopPointer ← TopPointer - 1", true, "then the pointer moves down");
      t.out(item, "OUTPUT Item", false);
    },
  }),
  program({
    id: "a-insertion", title: "Insertion sort", topic: "Insertion sort · shifting",
    vars: ["i", "Key", "j", "Arr[1]", "Arr[2]", "Arr[3]"],
    code: `
// Arr[1:3] holds 7, 3, 5
DECLARE i, j, Key : INTEGER
FOR i ← 2 TO 3
    Key ← Arr[i]
    j ← i - 1
    WHILE j >= 1 AND Arr[j] > Key
        Arr[j + 1] ← Arr[j]
        j ← j - 1
    ENDWHILE
    Arr[j + 1] ← Key
NEXT i`,
    run: (t) => {
      const a = [0, 7, 3, 5];
      for (let i = 2; i <= 3; i++) {
        t.set("i", i, "FOR i", false);
        const key = t.set("Key", a[i], "Key ← Arr[i]", true, `Key = Arr[${i}]`) as number;
        let j = t.set("j", i - 1, "j ← i - 1", false) as number;
        while (j >= 1 && a[j] > key) {
          a[j + 1] = t.set(`Arr[${j + 1}]`, a[j], "Arr[j + 1] ← Arr[j]", true, `${a[j]} > ${key}, so shift ${a[j]} right`) as number;
          j = t.set("j", j - 1, "j ← j - 1", false) as number;
        }
        a[j + 1] = t.set(`Arr[${j + 1}]`, key, "Arr[j + 1] ← Key", true, `drop Key into the gap at position ${j + 1}`) as number;
      }
    },
  }),
  program({
    id: "a-byref", title: "BYREF vs BYVAL", topic: "Procedures · parameter passing",
    vars: ["X", "Y", "Temp", "A"],
    code: `
PROCEDURE Swap(BYREF A : INTEGER, BYREF B : INTEGER)
    DECLARE Temp : INTEGER
    Temp ← A
    A ← B
    B ← Temp
ENDPROCEDURE

PROCEDURE Double(BYVAL A : INTEGER)
    A ← A * 2
ENDPROCEDURE

X ← 3
Y ← 8
CALL Swap(X, Y)
CALL Double(X)
OUTPUT X
OUTPUT Y`,
    run: (t) => {
      t.set("X", 3, "X ← 3", false); t.set("Y", 8, "Y ← 8", false);
      t.set("Temp", 3, "Temp ← A", true, "A refers to X, which is 3");
      t.set("X", 8, "A ← B", true, "BYREF: changing A really changes X");
      t.set("Y", 3, "B ← Temp", true, "BYREF: changing B really changes Y");
      t.set("A", 16, "A ← A * 2", true, "Double gets a COPY of X (8)");
      t.out(8, "OUTPUT X", true); t.set("OUTPUT", 3, "OUTPUT Y", true);
      t.steps[t.steps.length - 2].wrong = ["16", "3"];
    },
  }),
];

export const TRACE_SETS: TraceSet[] = [
  { key: "o", game: "trace-o", label: "O Level", blurb: "Loops, totals, MOD, SUBSTRING (0478 style)", programs: O },
  { key: "as", game: "trace-as", label: "AS Level", blurb: "MOD/DIV, MID, searching, bubble sort, functions (9618)", programs: AS },
  { key: "a", game: "trace-a", label: "A Level", blurb: "Recursion, binary search, stacks, insertion sort, BYREF (9618)", programs: A },
];
