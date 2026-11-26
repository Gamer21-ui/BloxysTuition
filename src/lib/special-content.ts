import "server-only";
/**
 * 🌟 Special Training content (AS & A Level Computer Science 9618). Server-only: it is rendered
 * on the server for special students and never shipped in the shared JS bundle.
 * Model answers are written by us in Cambridge style. They are not copied from mark schemes.
 */

export const COMMAND_WORDS: { word: string; means: string; marks: string; example: string }[] = [
  { word: "State / Give / Identify", means: "A short fact or name. No explanation needed.", marks: "Usually 1 mark per point", example: "State one register used in the F-E cycle → \"Program Counter (PC)\"" },
  { word: "Define", means: "The exact meaning of a term, in one or two precise sentences.", marks: "1–2 marks", example: "Define 'protocol' → \"A set of rules that govern how data is transmitted between devices.\"" },
  { word: "Describe", means: "Say what it is or what happens: features or steps, in order. No 'why' needed.", marks: "1 mark per correct point/step", example: "Describe how a binary search works → step by step: middle item, compare, discard half…" },
  { word: "Explain", means: "What + WHY or HOW. Every point needs a reason ('because…', 'so that…').", marks: "Often 2 marks: point + expansion", example: "Explain why a compiler is used for the final version → \"It produces an executable file, so the program can run without the source code / translator.\"" },
  { word: "Outline", means: "The main points only, briefly. Less detail than 'describe'.", marks: "1 mark per point", example: "Outline the stages of the program development life cycle" },
  { word: "Justify", means: "Give reasons that SUPPORT a choice, linked to the scenario in the question.", marks: "Marks only for reasons tied to the context", example: "Justify the use of a star topology for this office → link every reason to the office" },
  { word: "Compare", means: "Similarities and/or differences. Mention BOTH things in every point.", marks: "1 mark per two-sided point", example: "\"RAM is volatile, WHEREAS ROM is non-volatile.\"" },
  { word: "Evaluate / Discuss", means: "Points for AND against, then a conclusion.", marks: "Balanced answers score highest", example: "Evaluate the use of AI in medicine → benefits, drawbacks, conclusion" },
  { word: "Write (pseudocode / program code)", means: "Working code that does exactly what's asked, using the identifiers the question gives.", marks: "1 mark per correct part of the logic", example: "Declare, initialise, loop, condition, output: each earns marks" },
  { word: "Complete", means: "Fill in the table, diagram or code that has been started.", marks: "1 mark per correct gap / row", example: "Complete the trace table: only write a value when it CHANGES" },
  { word: "Calculate / Show your working", means: "Do the maths AND show each step.", marks: "Working marks even if the final answer is wrong", example: "Calculate the file size in KiB: show bits → bytes → KiB" },
  { word: "Draw / Sketch", means: "A clear, labelled diagram using the standard symbols.", marks: "Marks for correct structure + labels", example: "Draw the logic circuit for X = (A AND B) OR NOT C" },
];

export const ANSWER_RECIPES: { title: string; recipe: string[]; question: string; model: string; trap: string }[] = [
  {
    title: "\"Explain one advantage / benefit of…\"",
    recipe: ["POINT: name the advantage", "EXPANSION: say why/how it happens", "CONTEXT: link it to the scenario if there is one"],
    question: "Explain one benefit of using library routines when writing a program. [2]",
    model: "Library routines have already been tested (point), so they are less likely to contain errors, which saves the programmer time on debugging (expansion).",
    trap: "Writing \"it's faster\" or \"it's easier\" on its own. Easier HOW? No reason = no second mark.",
  },
  {
    title: "\"Describe the fetch–execute cycle\"",
    recipe: ["Give steps in ORDER", "Name every register you use (PC, MAR, MDR, CIR, ACC)", "Use arrows or 'then' to show order: one step per mark"],
    question: "Describe the stages of the fetch–execute cycle. [4]",
    model: "The address in the PC is copied to the MAR. The PC is incremented. The instruction at that address is copied into the MDR (via the data bus). The instruction is copied from the MDR to the CIR. It is decoded by the control unit, then executed.",
    trap: "Saying \"the CPU fetches the instruction\" with no registers: that's GCSE level and scores little.",
  },
  {
    title: "\"Justify the choice of…\"",
    recipe: ["Pick the feature", "Say WHY it matters", "Tie it to THIS scenario (use words from the question)"],
    question: "A shop records stock levels. Justify using a database rather than separate files. [2]",
    model: "Data is stored once, so there is less data redundancy, meaning the shop's stock level for an item cannot be different in two places (data inconsistency is avoided).",
    trap: "A generic answer that could be about any system. Use the scenario's own nouns (shop, stock).",
  },
  {
    title: "\"Write pseudocode to…\"",
    recipe: ["DECLARE what you use (the question may award marks for it)", "Initialise totals/counters BEFORE loops", "Use the EXACT identifiers the question gives", "Indent, close every structure (ENDIF, NEXT i, ENDWHILE)", "Output what's asked, in the format asked"],
    question: "Write pseudocode to input 20 numbers and output how many are negative. [5]",
    model: "DECLARE Num, Count, i : INTEGER\nCount ← 0\nFOR i ← 1 TO 20\n    INPUT Num\n    IF Num < 0 THEN\n        Count ← Count + 1\n    ENDIF\nNEXT i\nOUTPUT Count",
    trap: "Putting Count ← 0 INSIDE the loop (it resets every time), or forgetting NEXT i.",
  },
  {
    title: "\"State the purpose of the algorithm / function\"",
    recipe: ["ONE sentence about what it ACHIEVES", "Don't describe it line by line", "Trace a small example first if you're unsure"],
    question: "State the purpose of function Mystery() (it returns the input string backwards). [1]",
    model: "It returns the string reversed.",
    trap: "\"It loops through the string and adds characters…\" describes HOW, not the purpose.",
  },
  {
    title: "\"Identify the error and give the correction\"",
    recipe: ["Give the LINE NUMBER", "Say what's wrong", "Write the corrected line in full"],
    question: "Line 06 reads FOR i ← 0 TO 10 but the array is Arr[1:10]. [2]",
    model: "Line 06: the loop starts at 0, which is outside the array bounds. Correction: FOR i ← 1 TO 10",
    trap: "Only describing the error without writing the fixed line: you lose the correction mark.",
  },
];

export type LadderTask = { stage: string; title: string; task: string; pseudo: string; vb: string; ask: string[] };

export const LADDER: LadderTask[] = [
  {
    stage: "1 · Basics", title: "Largest of three",
    task: "Input three integers and output the largest one.",
    pseudo: `DECLARE A, B, C, Largest : INTEGER
INPUT A
INPUT B
INPUT C
Largest ← A
IF B > Largest THEN
    Largest ← B
ENDIF
IF C > Largest THEN
    Largest ← C
ENDIF
OUTPUT "Largest is ", Largest`,
    vb: `Dim A, B, C, Largest As Integer
A = Integer.Parse(Console.ReadLine())
B = Integer.Parse(Console.ReadLine())
C = Integer.Parse(Console.ReadLine())
Largest = A
If B > Largest Then Largest = B
If C > Largest Then Largest = C
Console.WriteLine("Largest is " & Largest)`,
    ask: ["What if two numbers are equal?", "Why start Largest at A and not at 0?", "How would you change it to find the smallest?"],
  },
  {
    stage: "1 · Basics", title: "Average until -1",
    task: "Keep inputting marks until -1 is entered (a 'rogue value'), then output the average. Don't crash if the first input is -1.",
    pseudo: `DECLARE Mark, Total, Count : INTEGER
Total ← 0
Count ← 0
INPUT Mark
WHILE Mark <> -1
    Total ← Total + Mark
    Count ← Count + 1
    INPUT Mark
ENDWHILE
IF Count > 0 THEN
    OUTPUT "Average: ", Total / Count
ELSE
    OUTPUT "No marks entered"
ENDIF`,
    vb: `Dim Mark, Total, Count As Integer
Mark = Integer.Parse(Console.ReadLine())
While Mark <> -1
    Total += Mark
    Count += 1
    Mark = Integer.Parse(Console.ReadLine())
End While
If Count > 0 Then
    Console.WriteLine("Average: " & Total / Count)
Else
    Console.WriteLine("No marks entered")
End If`,
    ask: ["Why is INPUT written twice?", "Why WHILE and not REPEAT here?", "What would happen without the IF Count > 0?"],
  },
  {
    stage: "2 · Strings", title: "Vowel counter",
    task: "Input a word and output how many vowels it contains (upper or lower case).",
    pseudo: `DECLARE Word, Ch : STRING
DECLARE i, Vowels : INTEGER
INPUT Word
Vowels ← 0
FOR i ← 1 TO LENGTH(Word)
    Ch ← TO_LOWER(MID(Word, i, 1))
    IF Ch = "a" OR Ch = "e" OR Ch = "i" OR Ch = "o" OR Ch = "u" THEN
        Vowels ← Vowels + 1
    ENDIF
NEXT i
OUTPUT Vowels`,
    vb: `Dim Word As String = Console.ReadLine()
Dim Vowels As Integer = 0
For i As Integer = 1 To Word.Length
    Dim Ch As String = Mid(Word, i, 1).ToLower()
    If "aeiou".Contains(Ch) Then Vowels += 1
Next
Console.WriteLine(Vowels)`,
    ask: ["Why convert to lower case first?", "MID(Word, i, 1): what are the three parameters?", "How would you count consonants instead?"],
  },
  {
    stage: "3 · Arrays", title: "Temperatures above average",
    task: "Input 10 temperatures into an array. Output the average and how many days were above it.",
    pseudo: `DECLARE Temp : ARRAY[1:10] OF REAL
DECLARE i, Above : INTEGER
DECLARE Total, Average : REAL
Total ← 0
FOR i ← 1 TO 10
    INPUT Temp[i]
    Total ← Total + Temp[i]
NEXT i
Average ← Total / 10
Above ← 0
FOR i ← 1 TO 10
    IF Temp[i] > Average THEN
        Above ← Above + 1
    ENDIF
NEXT i
OUTPUT "Average: ", Average
OUTPUT Above, " days were above average"`,
    vb: `Dim Temp(10) As Double          ' we use indexes 1 to 10
Dim Total As Double = 0
For i As Integer = 1 To 10
    Temp(i) = Double.Parse(Console.ReadLine())
    Total += Temp(i)
Next
Dim Average As Double = Total / 10
Dim Above As Integer = 0
For i As Integer = 1 To 10
    If Temp(i) > Average Then Above += 1
Next
Console.WriteLine("Average: " & Average)
Console.WriteLine(Above & " days were above average")`,
    ask: ["Why do we NEED an array here (why not one variable)?", "Why two loops instead of one?", "REAL vs INTEGER: why REAL?"],
  },
  {
    stage: "4 · Functions", title: "IsPrime()",
    task: "Write a function IsPrime(N) that returns TRUE if N is prime. Use it to output every prime from 1 to 50.",
    pseudo: `FUNCTION IsPrime(N : INTEGER) RETURNS BOOLEAN
    DECLARE D : INTEGER
    IF N < 2 THEN
        RETURN FALSE
    ENDIF
    FOR D ← 2 TO N - 1
        IF N MOD D = 0 THEN
            RETURN FALSE
        ENDIF
    NEXT D
    RETURN TRUE
ENDFUNCTION

DECLARE N : INTEGER
FOR N ← 1 TO 50
    IF IsPrime(N) = TRUE THEN
        OUTPUT N
    ENDIF
NEXT N`,
    vb: `Function IsPrime(N As Integer) As Boolean
    If N < 2 Then Return False
    For D As Integer = 2 To N - 1
        If N Mod D = 0 Then Return False
    Next
    Return True
End Function

Sub Main()
    For N As Integer = 1 To 50
        If IsPrime(N) Then Console.WriteLine(N)
    Next
End Sub`,
    ask: ["Function vs procedure: which one returns a value?", "Why is N < 2 checked first?", "Could the loop stop earlier than N - 1? (hint: square root)"],
  },
  {
    stage: "5 · Files", title: "Copy the A-names",
    task: "Read every line of Names.txt and write the names that start with 'A' into ANames.txt.",
    pseudo: `DECLARE Line : STRING
OPENFILE "Names.txt" FOR READ
OPENFILE "ANames.txt" FOR WRITE
WHILE NOT EOF("Names.txt")
    READFILE "Names.txt", Line
    IF LEFT(Line, 1) = "A" THEN
        WRITEFILE "ANames.txt", Line
    ENDIF
ENDWHILE
CLOSEFILE "Names.txt"
CLOSEFILE "ANames.txt"`,
    vb: `' needs  Imports System.IO  at the top of the file
Dim Reader As New StreamReader("Names.txt")
Dim Writer As New StreamWriter("ANames.txt")
While Not Reader.EndOfStream
    Dim Line As String = Reader.ReadLine()
    If Left(Line, 1) = "A" Then Writer.WriteLine(Line)
End While
Reader.Close()
Writer.Close()`,
    ask: ["WRITE vs APPEND: what's the difference?", "Why check EOF BEFORE reading?", "What happens if you forget CLOSEFILE?"],
  },
  {
    stage: "6 · Paper 2 style", title: "Validate a username",
    task: "Write a function ValidUsername(Name) that returns TRUE only if: it is 6–12 characters long, the first character is a letter, and it contains no spaces.",
    pseudo: `FUNCTION ValidUsername(Name : STRING) RETURNS BOOLEAN
    DECLARE i : INTEGER
    DECLARE First : STRING
    IF LENGTH(Name) < 6 OR LENGTH(Name) > 12 THEN
        RETURN FALSE
    ENDIF
    First ← MID(Name, 1, 1)
    IF NOT ((First >= "A" AND First <= "Z") OR (First >= "a" AND First <= "z")) THEN
        RETURN FALSE
    ENDIF
    FOR i ← 1 TO LENGTH(Name)
        IF MID(Name, i, 1) = " " THEN
            RETURN FALSE
        ENDIF
    NEXT i
    RETURN TRUE
ENDFUNCTION`,
    vb: `Function ValidUsername(Name As String) As Boolean
    If Name.Length < 6 Or Name.Length > 12 Then Return False
    If Not Char.IsLetter(Name(0)) Then Return False
    For i As Integer = 1 To Name.Length
        If Mid(Name, i, 1) = " " Then Return False
    Next
    Return True
End Function`,
    ask: ["Which test data would you use? (normal, boundary, erroneous)", "Boundary values for the length rule?", "Why return FALSE early instead of using a flag?"],
  },
  {
    stage: "7 · A Level", title: "Stack: Push & Pop",
    task: "Implement a stack of up to 10 integers using a global array and TopPointer. Push must report 'Stack full'; Pop must report 'Stack empty' and return -1.",
    pseudo: `DECLARE Stack : ARRAY[1:10] OF INTEGER
DECLARE TopPointer : INTEGER
TopPointer ← 0

PROCEDURE Push(Item : INTEGER)
    IF TopPointer = 10 THEN
        OUTPUT "Stack full"
    ELSE
        TopPointer ← TopPointer + 1
        Stack[TopPointer] ← Item
    ENDIF
ENDPROCEDURE

FUNCTION Pop() RETURNS INTEGER
    DECLARE Item : INTEGER
    IF TopPointer = 0 THEN
        OUTPUT "Stack empty"
        RETURN -1
    ELSE
        Item ← Stack[TopPointer]
        TopPointer ← TopPointer - 1
        RETURN Item
    ENDIF
ENDFUNCTION`,
    vb: `Module Module1
    Dim Stack(10) As Integer
    Dim TopPointer As Integer = 0

    Sub Push(Item As Integer)
        If TopPointer = 10 Then
            Console.WriteLine("Stack full")
        Else
            TopPointer += 1
            Stack(TopPointer) = Item
        End If
    End Sub

    Function Pop() As Integer
        If TopPointer = 0 Then
            Console.WriteLine("Stack empty")
            Return -1
        End If
        Dim Item As Integer = Stack(TopPointer)
        TopPointer -= 1
        Return Item
    End Function
End Module`,
    ask: ["Why is Push a procedure but Pop a function?", "How would a queue be different?", "What's the problem with returning -1 as an 'error'?"],
  },
];
