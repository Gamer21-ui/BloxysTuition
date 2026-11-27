import "server-only";
/**
 * 🌟 Pro trace programs: exam-style 9618 Paper 2 / Paper 4 tracing, each with a VB.NET version.
 * Server-only so the code never ships to students who aren't on Special Training.
 */
import { program, type TraceSet } from "./trace";

const PRO = [
  program({
    id: "pro-password", title: "Password checker", topic: "Paper 2 style · MID · character ranges · Boolean",
    vars: ["i", "Ch", "Upper", "Digit", "Valid"],
    code: `
DECLARE Pass, Ch : STRING
DECLARE Upper, Digit, i : INTEGER
DECLARE Valid : BOOLEAN
Pass ← "Rb7xQ2"
Upper ← 0
Digit ← 0
FOR i ← 1 TO LENGTH(Pass)
    Ch ← MID(Pass, i, 1)
    IF Ch >= "A" AND Ch <= "Z" THEN
        Upper ← Upper + 1
    ELSE
        IF Ch >= "0" AND Ch <= "9" THEN
            Digit ← Digit + 1
        ENDIF
    ENDIF
NEXT i
Valid ← Upper >= 2 AND Digit >= 2
OUTPUT Valid`,
    vb: `
Dim Pass As String = "Rb7xQ2"
Dim Upper As Integer = 0
Dim Digit As Integer = 0
For i As Integer = 1 To Pass.Length
    Dim Ch As String = Mid(Pass, i, 1)
    If Ch >= "A" And Ch <= "Z" Then
        Upper += 1
    ElseIf Ch >= "0" And Ch <= "9" Then
        Digit += 1
    End If
Next
Dim Valid As Boolean = Upper >= 2 And Digit >= 2
Console.WriteLine(Valid)`,
    run: (t) => {
      const p = "Rb7xQ2"; let u = t.set("Upper", 0, "Upper ← 0", false) as number; let d = t.set("Digit", 0, "Digit ← 0", false) as number;
      for (let i = 1; i <= p.length; i++) {
        t.set("i", i, "FOR i", false);
        const ch = t.set("Ch", p[i - 1], "Ch ← MID", true, `MID("Rb7xQ2", ${i}, 1)`, [p[i] ?? p[0]]) as string;
        if (ch >= "A" && ch <= "Z") u = t.set("Upper", u + 1, "Upper ← Upper + 1", true, `"${ch}" is between "A" and "Z"`) as number;
        else if (ch >= "0" && ch <= "9") d = t.set("Digit", d + 1, "Digit ← Digit + 1", true, `"${ch}" is a digit character`) as number;
      }
      t.set("Valid", u >= 2 && d >= 2, "Valid ← Upper", true, `${u} >= 2 AND ${d} >= 2`);
      t.out(u >= 2 && d >= 2, "OUTPUT Valid", false);
    },
  }),
  program({
    id: "pro-linked", title: "Linked list traversal", topic: "Paper 3/4 · linked lists · null pointer",
    vars: ["Current"],
    code: `
//  Index:      1      2      3      4
//  Data:     "Cat"  "Ant"  "Bee"  "Dog"
//  Pointer:    4      3      1     -1
StartPointer ← 2
Current ← StartPointer
WHILE Current <> -1
    OUTPUT Data[Current]
    Current ← Pointer[Current]
ENDWHILE`,
    vb: `
Dim Data() As String = {"", "Cat", "Ant", "Bee", "Dog"}
Dim Pointer() As Integer = {0, 4, 3, 1, -1}
Dim StartPointer As Integer = 2
Dim Current As Integer = StartPointer
While Current <> -1
    Console.WriteLine(Data(Current))
    Current = Pointer(Current)
End While`,
    run: (t) => {
      const data = ["", "Cat", "Ant", "Bee", "Dog"], ptr = [0, 4, 3, 1, -1];
      let c = t.set("Current", 2, "Current ← StartPointer", false) as number;
      while (c !== -1) {
        t.out(data[c], "OUTPUT Data[Current]", true);
        const nx = ptr[c];
        c = t.set("Current", nx, "Current ← Pointer[Current]", true, `Pointer[${c}] = ${nx}${nx === -1 ? " (null: end of list)" : ""}`, [c + 1]) as number;
      }
    },
  }),
  program({
    id: "pro-grid", title: "2D array row totals", topic: "Paper 2 style · 2D arrays · nested loops",
    vars: ["Row", "Col", "RowTotal"],
    code: `
//  Grid[1:2, 1:3]     Col 1  Col 2  Col 3
//          Row 1:       2      5      1
//          Row 2:       4      0      6
DECLARE Row, Col, RowTotal : INTEGER
FOR Row ← 1 TO 2
    RowTotal ← 0
    FOR Col ← 1 TO 3
        RowTotal ← RowTotal + Grid[Row, Col]
    NEXT Col
    OUTPUT RowTotal
NEXT Row`,
    vb: `
Dim Grid(,) As Integer = {{2, 5, 1}, {4, 0, 6}}   ' VB arrays start at 0
For Row As Integer = 0 To 1
    Dim RowTotal As Integer = 0
    For Col As Integer = 0 To 2
        RowTotal += Grid(Row, Col)
    Next
    Console.WriteLine(RowTotal)
Next`,
    run: (t) => {
      const g = [[], [0, 2, 5, 1], [0, 4, 0, 6]];
      for (let r = 1; r <= 2; r++) {
        t.set("Row", r, "FOR Row", false);
        let tot = t.set("RowTotal", 0, "RowTotal ← 0", r === 2, "RowTotal is RESET for each new row") as number;
        for (let c = 1; c <= 3; c++) {
          t.set("Col", c, "FOR Col", false);
          tot = t.set("RowTotal", tot + g[r][c], "RowTotal ← RowTotal + Grid", true, `Grid[${r}, ${c}] = ${g[r][c]}`) as number;
        }
        t.out(tot, "OUTPUT RowTotal", true);
      }
    },
  }),
  program({
    id: "pro-mystery", title: "Mystery recursive function", topic: "Paper 4 style · recursion with strings",
    vars: ["Call", "S", "Returns"],
    code: `
FUNCTION Mystery(S : STRING) RETURNS STRING
    IF LENGTH(S) <= 1 THEN
        RETURN S
    ELSE
        RETURN Mystery(RIGHT(S, LENGTH(S) - 1)) & LEFT(S, 1)
    ENDIF
ENDFUNCTION

OUTPUT Mystery("ABC")
// Exam question: state the purpose of Mystery()`,
    vb: `
Function Mystery(S As String) As String
    If S.Length <= 1 Then
        Return S
    Else
        Return Mystery(Right(S, S.Length - 1)) & Left(S, 1)
    End If
End Function

Console.WriteLine(Mystery("ABC"))`,
    run: (t) => {
      // Call = which copy of Mystery is running (1 = the first call). Calls go down, RETURNs come back up.
      t.set("Call", 1, "FUNCTION Mystery", false);
      t.set("S", "ABC", "FUNCTION Mystery", false);
      t.set("Call", 2, "RETURN Mystery(RIGHT", false);
      t.ask("S", "BC", "FUNCTION Mystery", 'Call 1 has S = "ABC", which is longer than 1, so it calls Mystery(RIGHT("ABC", 2)). What is S in call 2?', 'RIGHT("ABC", 2) = "BC"', ["AB"]);
      t.set("Call", 3, "RETURN Mystery(RIGHT", false);
      t.ask("S", "C", "FUNCTION Mystery", 'Call 2 has S = "BC", still longer than 1, so it calls Mystery(RIGHT("BC", 1)). What is S in call 3?', 'RIGHT("BC", 1) = "C"', ["B"]);
      t.ask("Returns", "C", "RETURN S", 'Call 3: LENGTH("C") is 1, so the IF is TRUE (the base case). What does call 3 return?', "base case: length 1, return it unchanged");
      t.set("Call", 2, "RETURN Mystery(RIGHT", false);
      t.ask("Returns", "CB", "RETURN Mystery(RIGHT", 'Back in call 2 (S = "BC"): it gets "C" from call 3, then adds LEFT(S, 1). What does call 2 return?', '"C" & LEFT("BC", 1) = "C" & "B"', ["BC"]);
      t.set("Call", 1, "RETURN Mystery(RIGHT", false);
      t.ask("Returns", "CBA", "RETURN Mystery(RIGHT", 'Back in call 1 (S = "ABC"): it gets "CB" from call 2, then adds LEFT(S, 1). What does call 1 return?', '"CB" & LEFT("ABC", 1) = "CB" & "A". Mystery reverses the string', ["ABC", "CAB"]);
      t.out("CBA", 'OUTPUT Mystery("ABC")', false);
    },
  }),
  program({
    id: "pro-bubble", title: "Efficient bubble sort", topic: "Paper 2 style · REPEAT · Swapped flag",
    vars: ["Upper", "Swapped", "j", "Arr[1]", "Arr[2]", "Arr[3]"],
    code: `
// Arr[1:3] holds 3, 1, 2
DECLARE Upper, j, Temp : INTEGER
DECLARE Swapped : BOOLEAN
Upper ← 3
REPEAT
    Swapped ← FALSE
    FOR j ← 1 TO Upper - 1
        IF Arr[j] > Arr[j + 1] THEN
            Temp ← Arr[j]
            Arr[j] ← Arr[j + 1]
            Arr[j + 1] ← Temp
            Swapped ← TRUE
        ENDIF
    NEXT j
    Upper ← Upper - 1
UNTIL Swapped = FALSE OR Upper = 1`,
    vb: `
Dim Arr() As Integer = {0, 3, 1, 2}
Dim Upper As Integer = 3
Dim Swapped As Boolean
Do
    Swapped = False
    For j As Integer = 1 To Upper - 1
        If Arr(j) > Arr(j + 1) Then
            Dim Temp As Integer = Arr(j)
            Arr(j) = Arr(j + 1)
            Arr(j + 1) = Temp
            Swapped = True
        End If
    Next
    Upper -= 1
Loop Until Swapped = False Or Upper = 1`,
    run: (t) => {
      const a = [0, 3, 1, 2];
      let up = t.set("Upper", 3, "Upper ← 3", false) as number;
      let sw: boolean;
      do {
        sw = t.set("Swapped", false, "Swapped ← FALSE", up < 3, "reset the flag at the start of every pass") as boolean;
        for (let j = 1; j <= up - 1; j++) {
          t.set("j", j, "FOR j", false);
          if (a[j] > a[j + 1]) {
            const tmp = a[j];
            a[j] = t.set(`Arr[${j}]`, a[j + 1], "Arr[j] ← Arr[j + 1]", true, `${tmp} > ${a[j + 1]}: swap`) as number;
            a[j + 1] = t.set(`Arr[${j + 1}]`, tmp, "Arr[j + 1] ← Temp", true) as number;
            sw = t.set("Swapped", true, "Swapped ← TRUE", false) as boolean;
          }
        }
        up = t.set("Upper", up - 1, "Upper ← Upper - 1", true, "each pass, the biggest value is already in place") as number;
      } while (!(sw === false || up === 1));
    },
  }),
];

export const PRO_SET: TraceSet = { key: "pro", game: "trace-pro", label: "🌟 Pro", blurb: "Exam-style Paper 2/4 traces, each with a VB.NET version", programs: PRO };
