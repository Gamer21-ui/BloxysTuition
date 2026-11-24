// Cambridge International AS & A Level Computer Science 9618 (syllabus for 2027–2029; same topics as 2026).
// AS = topics 1–12 (Papers 1 & 2), A Level = topics 13–20 (Papers 3 & 4, AS assumed).
// Questions: [prompt, options, correctIndex, explanation] with the correct answer first (shuffled at build time).
const C = "\x60\x60\x60";

const AS = {
  slug: "as-computer-science", code: "9618", title: "AS Level Computer Science", tier: "AS", color: "#a855f7", icon: "cpu",
  exam_label: "Cambridge International AS Level Computer Science 9618 · Nov 2027",
  description: "Topics 1–12. Paper 1: Theory Fundamentals (1h30). Paper 2: Problem-solving and Programming Skills (2h). No calculators.",
  chapters: [
    { n: "1", t: "Information representation",
      parts: ["1.1 Data representation", "1.2 Multimedia", "1.3 Compression"],
      q: [
        ["What is the denary value of the 8-bit two's complement number 11111110?", ["−2", "254", "−126", "−1"], 0, "MSB is −128: −128 + 64 + 32 + 16 + 8 + 4 + 2 = −2."],
        ["How many bytes are in a kibibyte (KiB)?", ["1024", "1000", "512", "2048"], 0, "Binary prefixes use powers of 2: 1 KiB = 2¹⁰ bytes."],
        ["BCD represents denary 59 as…", ["0101 1001", "0011 1011", "0101 1010", "0111 0011"], 0, "Each denary digit gets its own 4-bit code: 5 = 0101, 9 = 1001."],
        ["A bitmap is 100 × 50 pixels with a colour depth of 8 bits. File size (ignoring header)?", ["5000 bytes", "40 000 bytes", "400 bytes", "5000 bits"], 0, "100 × 50 × 8 = 40 000 bits = 5000 bytes."],
        ["Increasing the sampling rate of a sound file will…", ["Improve accuracy and increase file size", "Reduce file size", "Reduce sound quality", "Have no effect"], 0, "More samples per second capture the wave more closely but need more storage."],
        ["Run-length encoding is an example of…", ["Lossless compression", "Lossy compression", "Encryption", "Hashing"], 0, "RLE stores runs of repeated data and the original can be fully restored."]],
      notes: [
`## Number systems
- **Binary** (base 2), **denary** (base 10), **hexadecimal** (base 16: 0–9, A–F)
- One hex digit = 4 bits (a nibble)

## Binary prefixes vs decimal prefixes
| Binary | Size | Decimal | Size |
|---|---|---|---|
| kibi (KiB) | 2¹⁰ = 1024 | kilo (kB) | 10³ |
| mebi (MiB) | 2²⁰ | mega (MB) | 10⁶ |
| gibi (GiB) | 2³⁰ | giga (GB) | 10⁹ |
| tebi (TiB) | 2⁴⁰ | tera (TB) | 10¹² |

## Negative numbers
- **One's complement**: flip all bits
- **Two's complement**: flip all bits and add 1. MSB has negative place value (−128 in 8 bits)

## Binary addition and overflow
Overflow happens when the result is too big for the number of bits.

## BCD
Each denary digit stored as 4 bits. Used in calculators and clocks.

## Character sets
ASCII (7-bit, 128 chars), extended ASCII (8-bit), **Unicode** (all languages and emoji).

> Exam tip: show your working for conversions.`,
`## Bitmap images
- **Pixel**: smallest element
- **Colour depth**: bits per pixel
- **Resolution**: number of pixels
- **File header**: dimensions, colour depth, compression type

**File size = width × height × colour depth** (bits)

## Vector graphics
Stored as **drawing objects** and **properties** (shape, coordinates, colour) in a **drawing list**. Scale without losing quality.

## Bitmap vs vector
Bitmaps suit photos; vectors suit logos and diagrams.

## Sound
- **Sampling rate**: samples per second
- **Sampling resolution**: bits per sample

**File size = sampling rate × resolution × length (s)**

Higher rate/resolution = more accurate, larger file.

> Exam tip: always convert bits to bytes (÷ 8) when asked for bytes.`,
`## Why compress?
Smaller files: faster transfer, less storage, less bandwidth.

## Lossless
Original data fully restored. Needed for text and program files.
- **Run-length encoding (RLE)**: store a value and how many times it repeats
  e.g. AAAABBB → 4A3B

## Lossy
Some data permanently removed. Used for images, sound, video.
- Removing sounds outside human hearing (perceptual coding)
- Reducing colour depth or resolution

> Exam tip: justify the choice: lossy for streaming, lossless for documents.`]
    },
    { n: "2", t: "Communication",
      parts: ["2.1 Networks including the internet"],
      q: [
        ["Which topology connects every device to a central switch?", ["Star", "Bus", "Mesh", "Ring"], 0, "If one cable fails, only that device is affected."],
        ["What does a router do?", ["Forwards packets between networks using IP addresses", "Connects devices in one LAN using MAC addresses only", "Converts analogue to digital", "Stores web pages"], 0, "Routers connect different networks, such as a LAN to the internet."],
        ["Which is a feature of IPv6?", ["128-bit addresses written in hexadecimal", "32-bit addresses", "No hexadecimal", "Only private addresses"], 0, "IPv6 gives a far larger address space than IPv4."],
        ["What is the role of DNS?", ["Translates domain names into IP addresses", "Encrypts data", "Assigns MAC addresses", "Stores emails"], 0, "Your browser asks a DNS server for the IP address of a URL."],
        ["In the client-server model…", ["Servers provide resources and services to clients", "All devices have equal status", "There is no central control", "Clients store all shared files"], 0, "Peer-to-peer has no central server."],
        ["CSMA/CD is used to…", ["Detect and handle collisions on a shared medium", "Encrypt data", "Assign IP addresses", "Compress files"], 0, "Devices wait a random time and retransmit after a collision."]],
      notes: [
`## Network types
- **LAN**: small area, owned by one organisation
- **WAN**: large area, uses third-party links
- **Client-server** vs **peer-to-peer**
- **Cloud computing**: public and private clouds

## Topologies
Bus, star, mesh, hybrid. Star is most common (central switch).

## Transmission media
- **Wired**: copper, fibre-optic
- **Wireless**: radio, microwave, satellite

## Hardware
Switch, router, NIC, WNIC, WAP, bridge, repeater, modem.

## Ethernet and CSMA/CD
Devices listen before sending; on a collision they wait a random time.

## The internet and the World Wide Web
- **Internet**: global network infrastructure
- **WWW**: web pages accessed via the internet

## IP addresses
- **IPv4**: 32-bit; **IPv6**: 128-bit hex
- **Public vs private**, **static vs dynamic**
- **Subnetting**

## DNS and URLs
DNS resolves domain names to IP addresses.

> Exam tip: distinguish the internet from the World Wide Web.`]
    },
    { n: "3", t: "Hardware",
      parts: ["3.1 Computers and their components", "3.2 Logic gates and logic circuits"],
      q: [
        ["Which type of memory needs refreshing?", ["DRAM", "SRAM", "ROM", "EEPROM"], 0, "DRAM uses capacitors that leak charge."],
        ["SRAM is mainly used for…", ["Cache memory", "Main memory in most PCs", "Storing the BIOS permanently", "Backing storage"], 0, "SRAM is faster but more expensive."],
        ["A laser printer uses…", ["A charged drum and toner", "Ink droplets", "Heat-sensitive paper", "Pins hitting a ribbon"], 0, "Static charge attracts toner to the drum."],
        ["Which gate outputs 1 only when both inputs are 0?", ["NOR", "NAND", "XOR", "AND"], 0, "NOR is OR followed by NOT."],
        ["An XOR gate outputs 1 when…", ["The inputs are different", "Both inputs are 1", "Both inputs are 0", "Any input is 1"], 0, "XOR = exclusive OR."],
        ["What is an embedded system?", ["A computer built into a larger device for a specific task", "A general-purpose PC", "A cloud server", "A smartphone app"], 0, "Examples include washing machines and car engine controllers."]],
      notes: [
`## Input and output devices
Keyboards, scanners, microphones, touchscreens, 3D printers, speakers, actuators.

## Primary memory
| Type | Features |
|---|---|
| **RAM** | Volatile, read/write |
| **SRAM** | Flip-flops, fast, no refresh, used for cache |
| **DRAM** | Capacitors, needs refreshing, cheaper, main memory |
| **ROM / PROM / EPROM / EEPROM** | Non-volatile |

## Secondary storage
- **Magnetic** (HDD): platters, read-write heads
- **Optical**: lasers, pits and lands
- **Solid state**: NAND flash, no moving parts

## Embedded systems
A microprocessor inside a larger device with a dedicated function.

## Sensors and actuators
Used in monitoring and control systems with feedback.

> Exam tip: be ready to describe how a laser printer, SSD or touchscreen works step by step.`,
`## Logic gates
| Gate | Output is 1 when |
|---|---|
| **NOT** | Input is 0 |
| **AND** | Both inputs are 1 |
| **OR** | At least one input is 1 |
| **NAND** | Not both 1 |
| **NOR** | Both 0 |
| **XOR** | Inputs differ |

## Logic circuits
Combine gates to solve problems. Construct a circuit from a written statement, a truth table or a logic expression.

## Truth tables
List every combination of inputs: 2 inputs = 4 rows, 3 inputs = 8 rows.

> Exam tip: use standard gate symbols and don't miss any input rows.`]
    },
    { n: "4", t: "Processor fundamentals",
      parts: ["4.1 Central Processing Unit (CPU) architecture", "4.2 Assembly language", "4.3 Bit manipulation"],
      q: [
        ["Which register holds the address of the next instruction?", ["Program Counter (PC)", "Current Instruction Register (CIR)", "Memory Data Register (MDR)", "Accumulator (ACC)"], 0, "The PC is incremented during each fetch."],
        ["Which bus carries addresses from the CPU to memory?", ["Address bus", "Data bus", "Control bus", "System clock"], 0, "The address bus is unidirectional."],
        ["Increasing which of these usually improves CPU performance?", ["Number of cores, clock speed and cache size", "Size of the monitor", "Hard disk capacity", "Number of USB ports"], 0, "These affect how many instructions are processed per second."],
        ["LDM #5 uses which addressing mode?", ["Immediate", "Direct", "Indirect", "Indexed"], 0, "The value 5 is loaded directly into the accumulator."],
        ["A logical shift left by one place on an unsigned binary number…", ["Multiplies it by 2", "Divides it by 2", "Inverts all bits", "Adds 1"], 0, "Bits move one place left and a 0 enters from the right."],
        ["To set a specific bit to 1 without changing others, use a mask with…", ["OR", "AND", "XOR", "NOT"], 0, "x OR 1 = 1, and x OR 0 = x."]],
      notes: [
`## Von Neumann architecture
Stored program concept: data and instructions share the same memory.

## Registers
| Register | Purpose |
|---|---|
| **PC** | Address of next instruction |
| **MAR** | Address to read/write |
| **MDR** | Data read or to be written |
| **CIR** | Current instruction |
| **ACC** | Results of calculations |
| **IX** | Index register |
| **Status register** | Flags (carry, overflow, zero, negative) |

## Components
ALU, CU, system clock, immediate access store; buses: **address**, **data**, **control**.

## Fetch-execute cycle (RTN)
MAR ← [PC]; PC ← [PC] + 1; MDR ← [[MAR]]; CIR ← [MDR]; decode; execute.

## Interrupts
Checked at the end of each cycle; ISR handles them.

## Performance
Clock speed, number of cores, cache size, bus width.

> Exam tip: learn the register transfer notation for the fetch stage.`,
`## Assembly language
Uses **mnemonics** (LDM, LDD, ADD, JMP, CMP). An **assembler** translates to machine code.

## Two-pass assembler
1. First pass builds the **symbol table** (labels → addresses)
2. Second pass generates machine code

## Addressing modes
| Mode | Example | Meaning |
|---|---|---|
| **Immediate** | LDM #5 | Load value 5 |
| **Direct** | LDD 100 | Load contents of address 100 |
| **Indirect** | LDI 100 | Address 100 holds the address of the data |
| **Indexed** | LDX 100 | Address 100 + IX |
| **Relative** | JMR #3 | Address relative to the current instruction |

## Instruction groups
Data movement, I/O, arithmetic, unconditional/conditional jumps, compare.

> Exam tip: practise tracing assembly programs in a trace table.`,
`## Shifts
- **Logical**: 0 enters vacated positions
- **Arithmetic**: keeps the sign bit on right shifts
- **Cyclic**: bits wrap round

Left shift ×2, right shift ÷2 (for positive numbers).

## Bit masks
| Operation | Use |
|---|---|
| **AND** with mask | Test or clear bits |
| **OR** with mask | Set bits to 1 |
| **XOR** with mask | Toggle bits |

## Uses
Monitoring and control systems: each bit can represent a sensor or device state.

> Exam tip: write the mask in binary first, then convert to the needed form.`]
    },
    { n: "5", t: "System software",
      parts: ["5.1 Operating systems", "5.2 Language translators"],
      q: [
        ["Which is a function of an operating system?", ["Memory management", "Compiling source code", "Word processing", "Designing websites"], 0, "The OS manages memory, processes, files, security and hardware."],
        ["Which utility rearranges files on a disk so their parts are stored together?", ["Defragmentation", "Backup", "Virus checker", "Disk formatter"], 0, "Reading contiguous data is faster on a hard disk."],
        ["A compiler…", ["Translates the whole program into machine code before it runs", "Translates and runs one line at a time", "Only checks spelling", "Runs only in the IDE"], 0, "It produces an executable file."],
        ["An advantage of an interpreter during development is…", ["Errors are reported line by line, so debugging is easier", "The program runs faster", "No translator is needed to run", "The source code is hidden"], 0, "Execution stops at the line with the error."],
        ["Program libraries…", ["Provide pre-written, tested routines", "Store user files", "Encrypt data", "Replace the OS"], 0, "DLLs are loaded at run time."],
        ["Which IDE feature lets a programmer pause execution at a chosen line?", ["Breakpoint", "Prettyprint", "Context-sensitive prompt", "Auto-complete"], 0, "Execution stops so variables can be inspected."]],
      notes: [
`## Why an OS is needed
Provides an interface and manages hardware and software.

## Key management tasks
Memory, file, security, hardware (drivers), process management; providing a user interface.

## Utility software
Disk formatter, virus checker, defragmentation, disk contents analysis/repair, file compression, backup.

## Program libraries
Pre-written code; **DLLs** are linked at run time, saving memory but creating dependencies.

> Exam tip: give the *benefit* of each utility, not just its name.`,
`## Translators
| Translator | Translates | Output |
|---|---|---|
| **Assembler** | Assembly | Machine code |
| **Compiler** | Whole high-level program | Executable |
| **Interpreter** | One statement at a time | Runs directly |

## Compiler vs interpreter
- Compiler: faster run, code hidden, errors reported at end
- Interpreter: easier debugging, needs translator each time

## Java style
Compiled to **intermediate code** (bytecode), then interpreted by a virtual machine: portable.

## IDE features
Coding (context-sensitive prompts, prettyprint), initial error detection (dynamic syntax checks), presentation (expand/collapse blocks), debugging (single stepping, breakpoints, variables/expressions report window).

> Exam tip: match the translator to the scenario: development vs distribution.`]
    },
    { n: "6", t: "Security, privacy and data integrity",
      parts: ["6.1 Data security", "6.2 Data integrity"],
      q: [
        ["What is the main purpose of a firewall?", ["To monitor and control network traffic based on rules", "To speed up the internet", "To encrypt files", "To create backups"], 0, "It blocks unauthorised access."],
        ["Phishing is…", ["Fake emails or websites designed to trick users into giving personal details", "A virus that copies itself", "Overloading a server with traffic", "Recording keystrokes"], 0, "Users are lured to a fraudulent site."],
        ["Validation checks that data is…", ["Reasonable and within set rules", "Exactly correct", "Copied accurately", "Encrypted"], 0, "Validation can't confirm data is actually true."],
        ["Verification by double entry means…", ["Data is entered twice and compared", "Checking data is in range", "Using a check digit", "Encrypting the data"], 0, "It checks data has been copied accurately."],
        ["A parity check detects…", ["Errors in transmitted data", "Viruses", "Incorrect passwords", "Out-of-range values"], 0, "The number of 1s must match the agreed parity."],
        ["A checksum is…", ["A value calculated from a block of data and sent with it", "A type of firewall", "A backup method", "A password"], 0, "The receiver recalculates it to check for errors."]],
      notes: [
`## Security, privacy and integrity
- **Security**: protecting data from loss or unauthorised access
- **Privacy**: keeping personal data confidential
- **Integrity**: data is accurate and consistent

## Threats
Malware (viruses, worms, spyware, ransomware), hacking, phishing, pharming, denial of service.

## Protection
User accounts, passwords, biometrics, two-step verification, firewalls, anti-virus, anti-spyware, encryption, access rights, backups, disk mirroring.

> Exam tip: name the threat *and* the specific measure that counters it.`,
`## Validation
Checks data is **reasonable**:
- Range, format, length, presence, existence, type, check digit

## Verification
Checks data is **copied accurately**:
- **Entry**: visual check, double entry
- **Transfer**: parity check (byte and block), checksum

## Parity
Even or odd parity: a parity bit makes the number of 1s even/odd. Parity blocks can find the exact bit in error.

> Exam tip: validation ≠ verification. Learn the difference clearly.`]
    },
    { n: "7", t: "Ethics and ownership",
      parts: ["7.1 Ethics and ownership"],
      q: [
        ["Copyright legislation protects…", ["The creator's rights over their work", "Users' privacy", "Network speed", "Data accuracy"], 0, "It prevents unauthorised copying."],
        ["Open-source software…", ["Has source code available for others to modify", "Must be paid for", "Is always unsafe", "Has no licence"], 0, "Users can study, change and redistribute it."],
        ["Shareware is…", ["Software that can be tried for free before paying", "Software that is always free", "Software with no copyright", "Software only for businesses"], 0, "Often time- or feature-limited."],
        ["Which is an ethical issue with artificial intelligence?", ["Bias in decision-making", "Faster processing", "Lower storage costs", "Better graphics"], 0, "AI may reflect biases in its training data."],
        ["Professional codes of conduct (e.g. BCS, IEEE) require members to…", ["Act in the public interest", "Maximise profit at any cost", "Avoid all teamwork", "Ignore legislation"], 0, "Members must act ethically and responsibly."],
        ["A commercial licence typically…", ["Requires payment and limits copying", "Allows unlimited redistribution", "Gives you the source code", "Has no conditions"], 0, "You pay to use software under the publisher's terms."]],
      notes: [
`## Ethics
Acting responsibly as a computing professional. Codes of conduct (e.g. BCS, IEEE): public interest, competence, integrity, duty to employers.

## Ownership and copyright
Protects the creator's work; copying without permission is illegal.

## Software licensing
| Type | Features |
|---|---|
| **Free Software Foundation** | Freedom to use, study, change, share |
| **Open Source Initiative** | Source code available |
| **Shareware** | Try before you buy |
| **Commercial** | Paid, restrictions |

## Artificial intelligence
Social, economic and environmental impacts: job changes, bias, privacy, accountability.

> Exam tip: give specific consequences of unethical behaviour.`]
    },
    { n: "8", t: "Databases",
      parts: ["8.1 Database concepts", "8.2 Database Management Systems (DBMS)", "8.3 Data Definition Language (DDL) and Data Manipulation Language (DML)"],
      q: [
        ["A primary key…", ["Uniquely identifies each record in a table", "Links two tables as a foreign key", "Is always a name", "Can contain duplicates"], 0, "No two records can share the same primary key value."],
        ["Which problem does a relational database reduce compared with a flat file?", ["Data redundancy", "Data security", "File size limits", "Network speed"], 0, "Data is stored once and linked."],
        ["A table is in 1NF if…", ["It has no repeating groups of attributes", "It has no partial dependencies", "It has no transitive dependencies", "It has only one field"], 0, "Each field holds atomic data."],
        ["The data dictionary contains…", ["Metadata about the database structure", "All customer records", "Backups", "User passwords only"], 0, "It describes tables, fields, types and relationships."],
        ["Which SQL statement retrieves data?", ["SELECT", "INSERT", "CREATE", "ALTER"], 0, "SELECT … FROM … WHERE … is DML."],
        ["Which is a DDL command?", ["CREATE TABLE", "SELECT", "UPDATE", "DELETE"], 0, "DDL defines the database structure."]],
      notes: [
`## Flat file vs relational
Flat files cause **redundancy** and **inconsistency**. Relational databases use linked tables.

## Terms
Entity, table, record (tuple), field (attribute), primary key, candidate key, secondary key, foreign key, relationship (1:1, 1:M, M:M), referential integrity, indexing.

## E-R diagrams
Show entities and relationships. M:M must be resolved with a link table.

## Normalisation
- **1NF**: no repeating groups
- **2NF**: 1NF + no partial dependencies
- **3NF**: 2NF + no non-key dependencies

> Exam tip: when normalising, show each table with its primary key underlined.`,
`## DBMS features
- **Data dictionary**: metadata
- **Data modelling**
- **Logical schema**
- **Data integrity** and **security** (passwords, access rights, backups)

## Developer interface and query processor
Lets developers create forms and reports; the query processor runs queries.

## Benefits
Reduced redundancy, consistency, controlled access, program-data independence.

> Exam tip: explain how a DBMS prevents inconsistency.`,
`## DDL (Data Definition Language)
${C}
CREATE DATABASE School;
CREATE TABLE Student (
  StudentID VARCHAR(6) PRIMARY KEY,
  Name VARCHAR(30),
  DOB DATE
);
ALTER TABLE Student ADD Email VARCHAR(40);
${C}

## DML (Data Manipulation Language)
${C}
SELECT Name, DOB FROM Student
WHERE DOB > '2009-01-01'
ORDER BY Name;

INSERT INTO Student VALUES ('S001', 'Ava', '2009-05-14', NULL);
UPDATE Student SET Name = 'Ava K' WHERE StudentID = 'S001';
DELETE FROM Student WHERE StudentID = 'S001';
${C}

## Joins and aggregates
INNER JOIN, GROUP BY, COUNT, SUM, AVG.

> Exam tip: end every SQL statement with a semicolon and check field names match the question.`]
    },
    { n: "9", t: "Algorithm design and problem-solving",
      parts: ["9.1 Computational thinking skills", "9.2 Algorithms"],
      q: [
        ["Abstraction means…", ["Removing unnecessary details to focus on what matters", "Splitting a problem into smaller parts", "Testing a program", "Writing code in assembly"], 0, "It simplifies a problem."],
        ["Decomposition means…", ["Breaking a problem into smaller sub-problems", "Removing unnecessary detail", "Combining modules", "Finding errors"], 0, "Each sub-problem is easier to solve."],
        ["Which pseudocode assigns 10 to Count?", ["Count ← 10", "Count = 10", "SET Count TO 10", "10 → Count"], 0, "Cambridge pseudocode uses ← for assignment."],
        ["A stepwise refinement approach…", ["Breaks each step into more detailed steps until it can be coded", "Writes all code at once", "Removes loops", "Tests only the final product"], 0, "It is top-down design."],
        ["A linear search…", ["Checks each item in turn until found", "Needs sorted data", "Halves the list each time", "Uses recursion only"], 0, "It works on unsorted data."],
        ["Which structure is best for repeating an unknown number of times, at least once?", ["REPEAT … UNTIL", "FOR … NEXT", "IF … THEN", "CASE … OF"], 0, "A post-condition loop always runs once."]],
      notes: [
`## Computational thinking
- **Abstraction**: remove unnecessary detail
- **Decomposition**: break into sub-problems
- **Pattern recognition** and **algorithmic thinking**

## Algorithms
A sequence of steps to solve a problem. Written in **structured English**, **flowcharts** or **pseudocode**.

> Exam tip: always identify inputs, processes and outputs first.`,
`## Cambridge pseudocode basics
${C}
DECLARE Total : INTEGER
DECLARE Count : INTEGER
Total ← 0
FOR Count ← 1 TO 10
    INPUT Num
    Total ← Total + Num
NEXT Count
OUTPUT "Average: ", Total / 10
${C}

## Selection
${C}
IF Mark >= 50 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Fail"
ENDIF
${C}

## Iteration
- **FOR … NEXT**: count-controlled
- **WHILE … ENDWHILE**: pre-condition
- **REPEAT … UNTIL**: post-condition

## Standard algorithms
Linear search, bubble sort, totalling, counting, finding max/min.

## Stepwise refinement
Break each step down until it can be coded.

> Exam tip: indent consistently and declare every variable.`]
    },
    { n: "10", t: "Data types and structures",
      parts: ["10.1 Data types and records", "10.2 Arrays", "10.3 Files", "10.4 Introduction to Abstract Data Types (ADT)"],
      q: [
        ["Which data type stores a single character?", ["CHAR", "STRING", "INTEGER", "BOOLEAN"], 0, "STRING stores zero or more characters."],
        ["DECLARE Scores : ARRAY[1:5] OF INTEGER creates…", ["A 1D array of 5 integers", "A 2D array", "5 separate variables", "A record"], 0, "Indexes run from 1 to 5."],
        ["A record data type…", ["Groups related fields of different types", "Stores only integers", "Is a type of file", "Holds one value"], 0, "E.g. a Student record with Name, Age and Grade."],
        ["A stack operates on which principle?", ["Last In, First Out (LIFO)", "First In, First Out", "Random access", "Sorted order"], 0, "Items are pushed and popped from the top."],
        ["A queue operates on which principle?", ["First In, First Out (FIFO)", "Last In, First Out", "Priority only", "Random access"], 0, "Items join at the rear and leave from the front."],
        ["Which command opens a text file for adding data to the end?", ["OPENFILE \"data.txt\" FOR APPEND", "OPENFILE \"data.txt\" FOR READ", "OPENFILE \"data.txt\" FOR WRITE", "READFILE \"data.txt\""], 0, "WRITE would overwrite the existing contents."]],
      notes: [
`## Data types
INTEGER, REAL, CHAR, STRING, BOOLEAN, DATE.

## Records
${C}
TYPE StudentRecord
    DECLARE Name : STRING
    DECLARE Age : INTEGER
ENDTYPE
DECLARE Pupil : StudentRecord
Pupil.Name ← "Lina"
${C}

> Exam tip: choose the most appropriate data type and justify it.`,
`## Arrays
${C}
DECLARE Marks : ARRAY[1:30] OF INTEGER
DECLARE Grid : ARRAY[1:3, 1:3] OF CHAR
${C}
- **Index**: position of an element
- **Lower/upper bound**

## Bubble sort
${C}
FOR Pass ← 1 TO N - 1
    FOR i ← 1 TO N - Pass
        IF A[i] > A[i + 1] THEN
            Temp ← A[i]
            A[i] ← A[i + 1]
            A[i + 1] ← Temp
        ENDIF
    NEXT i
NEXT Pass
${C}

## Linear search
Compare each element with the target until found or the end is reached.

> Exam tip: a flag variable can stop the sort early when no swaps occur.`,
`## Text files
${C}
OPENFILE "names.txt" FOR WRITE
WRITEFILE "names.txt", "Ali"
CLOSEFILE "names.txt"

OPENFILE "names.txt" FOR READ
WHILE NOT EOF("names.txt")
    READFILE "names.txt", Line
    OUTPUT Line
ENDWHILE
CLOSEFILE "names.txt"
${C}
Modes: **READ**, **WRITE** (overwrites), **APPEND**.

## Why use files?
Data persists after the program ends.

> Exam tip: always CLOSEFILE when finished.`,
`## Abstract data types (ADTs)
A collection of data and the operations on it.

| ADT | Principle | Operations |
|---|---|---|
| **Stack** | LIFO | Push, pop; top pointer |
| **Queue** | FIFO | Enqueue, dequeue; front and rear pointers |
| **Linked list** | Nodes with pointers | Insert, delete, search; start pointer, free list |

## Implementing with arrays
Stacks and queues use an array plus pointers. A **circular queue** reuses space.

> Exam tip: check for full/empty conditions before push/enqueue or pop/dequeue.`]
    },
    { n: "11", t: "Programming",
      parts: ["11.1 Programming basics", "11.2 Constructs", "11.3 Structured programming"],
      q: [
        ["Which built-in function returns part of a string?", ["MID", "LENGTH", "UCASE", "INT"], 0, "MID(\"Computer\", 1, 3) returns \"Com\"."],
        ["A CASE statement is a form of…", ["Selection", "Iteration", "Assignment", "Declaration"], 0, "It chooses between several options."],
        ["A function differs from a procedure because it…", ["Returns a value", "Cannot have parameters", "Is not a subroutine", "Can only be used once"], 0, "Functions are used in expressions."],
        ["Passing a parameter BYREF means…", ["The subroutine can change the original variable", "A copy of the value is passed", "The parameter is constant", "The variable is global"], 0, "BYVAL passes a copy."],
        ["A local variable…", ["Is only accessible within the subroutine where it is declared", "Can be used anywhere", "Keeps its value forever", "Is always an integer"], 0, "This avoids accidental changes elsewhere."],
        ["Which loop is pre-condition?", ["WHILE … ENDWHILE", "REPEAT … UNTIL", "FOR … NEXT", "CASE … ENDCASE"], 0, "The condition is checked before the loop body runs."]],
      notes: [
`## Variables and constants
${C}
DECLARE Name : STRING
CONSTANT Pi = 3.142
${C}

## Built-in functions
| Function | Example | Result |
|---|---|---|
| LENGTH | LENGTH("Hello") | 5 |
| MID | MID("Hello", 2, 3) | "ell" |
| LEFT / RIGHT | LEFT("Hello", 2) | "He" |
| UCASE / LCASE | UCASE("a") | "A" |
| INT | INT(7.9) | 7 |
| RAND | RAND(10) | 0 to < 10 |
| NUM_TO_STR / STR_TO_NUM | | conversions |

## Input/output
INPUT and OUTPUT.

> Exam tip: check the pseudocode guide for exact function names.`,
`## Selection
${C}
CASE OF Grade
    'A' : OUTPUT "Excellent"
    'B' : OUTPUT "Good"
    OTHERWISE OUTPUT "Keep going"
ENDCASE
${C}

## Iteration
${C}
WHILE Total < 100
    INPUT Num
    Total ← Total + Num
ENDWHILE

REPEAT
    INPUT Password
UNTIL Password = "secret"
${C}

## Nested constructs
Loops and selections inside each other.

> Exam tip: choose a loop to match the problem: known count → FOR.`,
`## Procedures and functions
${C}
PROCEDURE Greet(BYVAL Name : STRING)
    OUTPUT "Hi ", Name
ENDPROCEDURE

FUNCTION Square(N : INTEGER) RETURNS INTEGER
    RETURN N * N
ENDFUNCTION

CALL Greet("Sam")
Result ← Square(4)
${C}

## Parameters
- **BYVAL**: copy passed; original unchanged
- **BYREF**: reference passed; original can change

## Local vs global variables
Local is safer; global is accessible everywhere.

## Benefits of subroutines
Reuse, easier testing, teamwork, readability.

> Exam tip: state the return type of every function.`]
    },
    { n: "12", t: "Software development",
      parts: ["12.1 Program development life cycle", "12.2 Program design", "12.3 Program testing and maintenance"],
      q: [
        ["Which life cycle model involves building, testing and refining in repeated cycles?", ["Iterative", "Waterfall", "Big bang", "Linear"], 0, "Each iteration adds functionality."],
        ["A structure chart shows…", ["Modules and the parameters passed between them", "Flow of data in a network", "Database tables", "Truth tables"], 0, "It is used in top-down design."],
        ["A syntax error is…", ["Breaking the rules of the programming language", "A wrong calculation", "A crash at run time", "A slow program"], 0, "The translator detects it."],
        ["A logic error…", ["Produces incorrect results but the program runs", "Stops compilation", "Is a typing error", "Only occurs in hardware"], 0, "E.g. using < instead of <=."],
        ["Testing with data at the edge of the valid range is…", ["Boundary testing", "Normal testing", "Abnormal testing", "Alpha testing"], 0, "Test values just inside and outside the limits."],
        ["Adaptive maintenance is carried out to…", ["Change the program to meet new requirements", "Fix errors", "Improve speed only", "Delete old code"], 0, "Corrective fixes errors; perfective improves performance."]],
      notes: [
`## Program development life cycle
Analysis → design → coding → testing → maintenance.

## Models
| Model | Features |
|---|---|
| **Waterfall** | Linear, each stage done once |
| **Iterative** | Repeated cycles, incremental |
| **RAD** | Prototypes, user feedback, fast |

> Exam tip: give a reason why a model fits a scenario.`,
`## Design tools
- **Structure charts**: modules, parameters, selection and iteration symbols
- **Flowcharts**
- **Pseudocode**
- **State-transition diagrams**: states, transitions, events

## Top-down design
Decomposition into modules.

> Exam tip: practise turning structure charts into pseudocode headers.`,
`## Types of error
- **Syntax**: grammar of the language
- **Logic**: wrong results
- **Run-time**: crash (e.g. division by zero)

## Test data
Normal, abnormal (erroneous), extreme, boundary.

## Testing methods
Dry run (trace table), walkthrough, white-box, black-box, integration, alpha, beta, acceptance, stub testing.

## Maintenance
- **Corrective**: fix errors
- **Adaptive**: new requirements
- **Perfective**: improve performance

> Exam tip: write a test plan with expected outcomes.`]
    }
  ]
};

const A = {
  slug: "a-computer-science", code: "9618", title: "A Level Computer Science", tier: "A", color: "#a855f7", icon: "cpu",
  exam_label: "Cambridge International A Level Computer Science 9618 · Nov 2028",
  description: "Topics 13–20 (AS content assumed). Paper 3: Advanced Theory (1h30). Paper 4: Practical in Python, Java or VB (2h30).",
  chapters: [
    { n: "13", t: "Data representation",
      parts: ["13.1 User-defined data types", "13.2 File organisation and access", "13.3 Floating-point numbers, representation and manipulation"],
      q: [
        ["An enumerated data type…", ["Lists all possible values", "Stores addresses", "Holds real numbers", "Stores records"], 0, "E.g. TYPE Season = (Spring, Summer, Autumn, Winter)."],
        ["A pointer data type stores…", ["The memory address of a variable", "A character", "A floating-point value", "A file name"], 0, "Used for dynamic data structures."],
        ["Which file organisation stores records in key order?", ["Sequential", "Serial", "Random", "Hashed"], 0, "Serial stores records in the order they arrive."],
        ["A hashing algorithm is used with…", ["Random (direct) access files", "Serial files", "Text files only", "Sequential files"], 0, "It calculates the address from the key."],
        ["Increasing the number of bits in the mantissa improves…", ["Precision", "Range", "Speed", "Compression"], 0, "More exponent bits increase range."],
        ["A normalised positive floating-point mantissa starts with…", ["0.1", "1.0", "0.0", "1.1"], 0, "Negative normalised mantissas start 1.0."]],
      notes: [
`## User-defined data types
- **Non-composite**: enumerated, pointer
- **Composite**: record, set, class

${C}
TYPE Season = (Spring, Summer, Autumn, Winter)
TYPE IntPointer = ^INTEGER
TYPE LetterSet = SET OF CHAR
${C}

## Why use them?
Model real-world data, improve readability and reduce errors.

> Exam tip: choose a type and explain why it suits the data.`,
`## File organisation
| Method | Description |
|---|---|
| **Serial** | Records stored in arrival order |
| **Sequential** | Records stored in key order |
| **Random** | Address calculated by hashing |

## Access methods
- **Sequential access**: read records in order
- **Direct access**: go straight to the record (using an index or hash)

## Hashing
Address = hash(key). **Collisions** are handled by open hashing (next free space) or overflow areas.

> Exam tip: match the method to the use: payroll (sequential batch) vs booking system (direct).`,
`## Floating-point representation
**Number = mantissa × 2^exponent** (both two's complement)

## Normalisation
- Positive mantissa starts **0.1**
- Negative mantissa starts **1.0**
Maximises precision.

## Precision vs range
- More mantissa bits → more **precision**
- More exponent bits → more **range**

## Errors
- **Rounding errors**: some values can't be stored exactly (e.g. 0.1)
- **Overflow**: too large; **underflow**: too small

> Exam tip: practise converting between denary and floating-point, showing each step.`]
    },
    { n: "14", t: "Communication and internet technologies",
      parts: ["14.1 Protocols", "14.2 Circuit switching, packet switching"],
      q: [
        ["Which layer of the TCP/IP stack does HTTP belong to?", ["Application", "Transport", "Internet", "Link"], 0, "HTTP, FTP, SMTP, POP3 and IMAP are application-layer protocols."],
        ["TCP is responsible for…", ["Splitting data into packets and ensuring reliable delivery", "Routing packets between networks", "Converting domain names", "Sending email"], 0, "It handles acknowledgements and resending."],
        ["Which protocol is used to send email to a mail server?", ["SMTP", "POP3", "IMAP", "FTP"], 0, "POP3 and IMAP retrieve email."],
        ["BitTorrent is an example of…", ["A peer-to-peer file-sharing protocol", "Circuit switching", "A routing table", "An email protocol"], 0, "Peers share pieces of files with each other."],
        ["In packet switching…", ["Packets may take different routes and are reassembled at the destination", "A dedicated path is reserved for the whole communication", "Data must be sent in one piece", "No headers are used"], 0, "This uses the network efficiently."],
        ["An advantage of circuit switching is…", ["Data arrives in order with a constant connection", "No path setup needed", "Efficient use of bandwidth", "Packets can be rerouted"], 0, "The dedicated path suits live voice calls."]],
      notes: [
`## Why protocols?
Rules that let devices communicate.

## TCP/IP stack
| Layer | Protocols |
|---|---|
| **Application** | HTTP, FTP, POP3, IMAP, SMTP, BitTorrent |
| **Transport** | TCP, UDP |
| **Internet (network)** | IP |
| **Link** | Ethernet, Wi-Fi |

## Key protocols
- **HTTP(S)**: web pages
- **FTP**: file transfer
- **SMTP**: send email; **POP3/IMAP**: retrieve
- **BitTorrent**: P2P (trackers, seeds, peers, swarm)

> Exam tip: describe what happens at each layer when data is sent.`,
`## Circuit switching
A dedicated path is set up for the whole communication.
**Pros**: data in order, constant quality. **Cons**: wastes bandwidth, setup time.

## Packet switching
Data split into packets with headers (source, destination, sequence number); each routed independently.
**Pros**: efficient, robust. **Cons**: packets may arrive out of order or be lost, delays.

## Routers
Use routing tables to forward packets.

> Exam tip: compare both methods for a given use, e.g. video calls.`]
    },
    { n: "15", t: "Hardware and virtual machines",
      parts: ["15.1 Processors, parallel processing and virtual machines", "15.2 Boolean algebra and logic circuits"],
      q: [
        ["RISC processors have…", ["A small set of simple instructions", "Many complex instructions", "Variable-length instructions only", "No registers"], 0, "Simple instructions suit pipelining."],
        ["Pipelining allows…", ["Different stages of several instructions to run at the same time", "One instruction at a time", "Parallel memory access only", "Larger cache"], 0, "Fetch, decode and execute overlap."],
        ["SIMD stands for…", ["Single Instruction, Multiple Data", "Single Input, Multiple Devices", "Simple Instruction, Multiple Decode", "Serial Instruction, Multiple Data"], 0, "Used in GPUs and array processors."],
        ["A virtual machine…", ["Emulates a computer system in software", "Is a faster physical CPU", "Is a type of RAM", "Is a network switch"], 0, "It allows running different OSs on one host."],
        ["A half adder adds…", ["Two bits, giving a sum and a carry", "Three bits", "Two bytes", "Two decimal digits"], 0, "Sum = A XOR B, Carry = A AND B."],
        ["In Boolean algebra, A + A.B simplifies to…", ["A", "B", "A.B", "A + B"], 0, "Absorption law."]],
      notes: [
`## RISC vs CISC
| RISC | CISC |
|---|---|
| Few simple instructions | Many complex instructions |
| Fixed-length | Variable-length |
| Many registers | Fewer registers |
| Easy to pipeline | Harder to pipeline |

## Pipelining
Instruction stages overlap. Interrupts and branches can disrupt the pipeline.

## Parallel processing (Flynn's taxonomy)
SISD, SIMD, MISD, MIMD. Massively parallel computers.

## Virtual machines
Software emulation of a computer. **Pros**: run multiple OSs, testing, security. **Cons**: slower, needs resources.

> Exam tip: give a real example of each type of parallel processing.`,
`## Boolean algebra laws
- **Identity**: A.1 = A, A + 0 = A
- **Null**: A.0 = 0, A + 1 = 1
- **Idempotent**: A.A = A, A + A = A
- **Inverse**: A.¬A = 0, A + ¬A = 1
- **Absorption**: A + A.B = A
- **De Morgan's**: ¬(A.B) = ¬A + ¬B; ¬(A + B) = ¬A.¬B

## Karnaugh maps
Group 1s in powers of 2 to simplify expressions.

## Adders and flip-flops
- **Half adder**: Sum = A XOR B, Carry = A AND B
- **Full adder**: adds a carry in
- **SR and JK flip-flops**: store one bit

> Exam tip: draw K-maps with Gray-code ordering (00, 01, 11, 10).`]
    },
    { n: "16", t: "System software",
      parts: ["16.1 Purposes of an operating system (OS)", "16.2 Translation software"],
      q: [
        ["Which scheduling algorithm gives each process a fixed time slice in turn?", ["Round robin", "First come first served", "Shortest job first", "Shortest remaining time"], 0, "Processes are cycled through in turn."],
        ["Paging divides memory into…", ["Fixed-size blocks", "Variable-size blocks", "Logical segments by function", "Single bytes"], 0, "Segmentation uses variable-size blocks."],
        ["Disk thrashing happens when…", ["Pages are swapped in and out so often that little real work is done", "The disk is full", "The CPU overheats", "The cache is too big"], 0, "Too much time is spent on paging."],
        ["Lexical analysis…", ["Converts source code into tokens", "Checks grammar", "Optimises code", "Produces machine code"], 0, "Whitespace and comments are removed."],
        ["Reverse Polish notation for (A + B) × C is…", ["A B + C ×", "A + B C ×", "× + A B C", "A B C + ×"], 0, "Operators follow their operands."],
        ["Backus-Naur Form (BNF) is used to…", ["Define the syntax of a language", "Schedule processes", "Manage memory", "Encrypt data"], 0, "It defines grammar rules formally."]],
      notes: [
`## Maximising resources
The OS manages the CPU, memory and I/O to maximise use.

## Process states
Ready, running, blocked. The **scheduler** moves processes between states.

## Scheduling algorithms
First come first served, shortest job first, shortest remaining time, round robin.

## Interrupts
Low-level scheduler handles interrupts.

## Memory management
- **Paging**: fixed-size pages and frames
- **Segmentation**: variable-size segments
- **Virtual memory**: uses disk as extra RAM
- **Page replacement**; **disk thrashing**

> Exam tip: describe how virtual memory works step by step.`,
`## Stages of compilation
1. **Lexical analysis**: tokens, symbol table
2. **Syntax analysis**: parse against grammar
3. **Code generation**
4. **Optimisation**

## Grammar
- **BNF** and **syntax diagrams** define language rules

${C}
<digit> ::= 0|1|2|3|4|5|6|7|8|9
<integer> ::= <digit>|<digit><integer>
${C}

## Reverse Polish notation (RPN)
Operators follow operands. Evaluated with a **stack**: (A + B) × C → A B + C ×

> Exam tip: practise converting infix to RPN and evaluating with a stack.`]
    },
    { n: "17", t: "Security",
      parts: ["17.1 Encryption, encryption protocols and digital certificates"],
      q: [
        ["Asymmetric encryption uses…", ["A public key and a private key", "One shared secret key", "No keys", "Only hashing"], 0, "Data encrypted with the public key is decrypted with the private key."],
        ["A digital signature is created by…", ["Encrypting a hash (digest) of the message with the sender's private key", "Encrypting the message with the receiver's public key", "Hashing the password", "Using a firewall"], 0, "The receiver uses the sender's public key to verify it."],
        ["A digital certificate…", ["Links a public key to its owner's identity, issued by a Certificate Authority", "Stores private keys", "Encrypts a hard drive", "Is a type of virus"], 0, "It helps prove the key is genuine."],
        ["SSL/TLS is used to…", ["Secure communication between client and server", "Compress web pages", "Send email only", "Assign IP addresses"], 0, "It provides encryption and authentication (HTTPS)."],
        ["Quantum cryptography uses…", ["Properties of photons to detect eavesdropping", "Very long passwords", "Hash tables", "Symmetric keys only"], 0, "Measuring a quantum state disturbs it."],
        ["A message digest is produced by…", ["A hashing algorithm", "A compiler", "A router", "A virus scanner"], 0, "Any change to the message changes the digest."]],
      notes: [
`## Encryption terms
Plaintext, ciphertext, key, encryption, decryption.

## Symmetric vs asymmetric
| Symmetric | Asymmetric |
|---|---|
| One shared key | Public and private key pair |
| Fast | Slower |
| Key distribution problem | Solves key distribution |

## Quantum cryptography
Uses photons; eavesdropping changes their state, so it's detected.

## SSL/TLS
Handshake: agree encryption, exchange certificates and keys, then encrypt data (HTTPS).

## Digital signatures and certificates
- **Signature**: hash of message encrypted with sender's **private** key; verified with the **public** key
- **Certificate**: issued by a **Certificate Authority**, binds a public key to an identity

> Exam tip: state exactly which key is used at each step.`]
    },
    { n: "18", t: "Artificial Intelligence (AI)",
      parts: ["18.1 Artificial Intelligence (AI)"],
      q: [
        ["Dijkstra's algorithm finds…", ["The shortest path between nodes in a weighted graph", "The largest value in a list", "A sorted list", "The hash of a key"], 0, "It's used in route planning."],
        ["A* differs from Dijkstra's because it…", ["Uses a heuristic to guide the search", "Doesn't use weights", "Can only search trees", "Is slower in all cases"], 0, "The heuristic estimates the distance to the goal."],
        ["Supervised learning uses…", ["Labelled training data", "No data", "Rewards and penalties only", "Unlabelled data only"], 0, "The model learns input → output mappings."],
        ["Reinforcement learning involves…", ["An agent learning through rewards and penalties", "Labelled data", "Clustering data", "Hard-coded rules only"], 0, "The agent learns which actions maximise reward."],
        ["Back propagation is used to…", ["Adjust the weights of an artificial neural network to reduce error", "Find the shortest path", "Encrypt data", "Sort data"], 0, "Errors are fed back through the layers."],
        ["Deep learning uses…", ["Neural networks with many hidden layers", "Only one layer", "Decision tables", "Spreadsheets"], 0, "More layers can learn complex patterns."]],
      notes: [
`## Graphs in AI
Nodes and edges represent states or locations.
- **Dijkstra's algorithm**: shortest path from a start node
- **A***: adds a heuristic (estimated distance to goal) for efficiency

## Machine learning
| Type | Data |
|---|---|
| **Supervised** | Labelled data |
| **Unsupervised** | Unlabelled; finds patterns (clustering) |
| **Reinforcement** | Rewards and penalties |

## Artificial neural networks
Input, hidden and output layers; weights; **back propagation** reduces error.
**Deep learning**: many hidden layers.

## Regression
Predicting values from data.

> Exam tip: practise tracing Dijkstra's on a small graph in a table.`]
    },
    { n: "19", t: "Computational thinking and problem solving",
      parts: ["19.1 Algorithms", "19.2 Recursion"],
      q: [
        ["Binary search requires the data to be…", ["Sorted", "Unsorted", "In a linked list only", "Stored in a file"], 0, "It halves the search space each time."],
        ["The time complexity of binary search is…", ["O(log n)", "O(n)", "O(n²)", "O(1)"], 0, "Each step halves the remaining items."],
        ["Insertion sort is efficient when the data is…", ["Nearly sorted", "Completely random", "Very large", "Stored in a tree"], 0, "Few items need to move."],
        ["A binary tree node typically stores…", ["Data plus left and right pointers", "Only data", "Three child pointers", "An index"], 0, "In-order traversal gives sorted output for a binary search tree."],
        ["Every recursive subroutine must have…", ["A base case", "A loop", "Global variables", "Two parameters"], 0, "Without a base case it never stops."],
        ["When a recursive call is made, the return address and local variables are stored on…", ["The stack", "The heap only", "The hard disk", "A queue"], 0, "Stack frames are popped as calls return."]],
      notes: [
`## Searching
- **Linear search**: O(n)
- **Binary search**: O(log n), sorted data

${C}
Low ← 1
High ← N
Found ← FALSE
WHILE Low <= High AND NOT Found
    Mid ← (Low + High) DIV 2
    IF A[Mid] = Target THEN
        Found ← TRUE
    ELSE
        IF A[Mid] < Target THEN
            Low ← Mid + 1
        ELSE
            High ← Mid - 1
        ENDIF
    ENDIF
ENDWHILE
${C}

## Sorting
Bubble sort and **insertion sort**; Big O notation for time and space complexity.

## ADTs
Linked lists, stacks, queues, binary trees, graphs, dictionaries: implemented with arrays and pointers.

> Exam tip: learn Big O for each standard algorithm.`,
`## Recursion
A subroutine that **calls itself**. It must have:
1. A **base case** (stopping condition)
2. A **general case** that moves towards the base case

${C}
FUNCTION Factorial(N : INTEGER) RETURNS INTEGER
    IF N = 0 THEN
        RETURN 1
    ELSE
        RETURN N * Factorial(N - 1)
    ENDIF
ENDFUNCTION
${C}

## How it works
Each call pushes a **stack frame** (parameters, local variables, return address). Frames are popped as calls return.

## Recursion vs iteration
Recursion is elegant but uses more memory and risks **stack overflow**.

> Exam tip: practise tracing recursive calls in a table.`]
    },
    { n: "20", t: "Further programming",
      parts: ["20.1 Programming paradigms", "20.2 File processing and exception handling"],
      q: [
        ["In OOP, encapsulation means…", ["Bundling data with its methods and hiding internal details", "Inheriting from a parent class", "Having many forms", "Using global variables"], 0, "Attributes are usually private, accessed via methods."],
        ["Inheritance allows…", ["A subclass to reuse attributes and methods of a parent class", "Data to be hidden", "Methods to be private only", "Variables to be global"], 0, "The child can also add or override methods."],
        ["Polymorphism means…", ["The same method name behaves differently for different classes", "Only one class exists", "Data cannot change", "All methods are private"], 0, "E.g. Shape.Area() for Circle and Square."],
        ["Prolog is an example of…", ["Declarative programming", "Procedural programming", "Low-level programming", "Object-oriented programming"], 0, "Facts and rules are queried with goals."],
        ["Exception handling is used to…", ["Deal with run-time errors without crashing", "Find syntax errors", "Speed up loops", "Declare variables"], 0, "TRY … EXCEPT (or catch) blocks handle errors."],
        ["Random access to a binary file uses…", ["SEEK to move to a record position", "READFILE only", "APPEND", "EOF only"], 0, "GETRECORD/PUTRECORD then read or write the record."]],
      notes: [
`## Programming paradigms
- **Low-level**: assembly, addressing modes
- **Imperative (procedural)**: step-by-step instructions
- **Object-oriented**: classes and objects
- **Declarative**: facts and rules (Prolog)

## OOP terms
Class, object, attribute, method, constructor, **encapsulation**, **inheritance**, **polymorphism**, containment (aggregation), getters and setters.

${C}
CLASS Pet
    PRIVATE Name : STRING
    PUBLIC PROCEDURE NEW(GivenName : STRING)
        Name ← GivenName
    ENDPROCEDURE
    PUBLIC FUNCTION GetName() RETURNS STRING
        RETURN Name
    ENDFUNCTION
ENDCLASS
${C}

## Declarative (Prolog)
${C}
parent(ana, ben).
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
${C}

> Exam tip: Paper 4 is practical: practise writing classes in your chosen language.`,
`## File processing
Serial, sequential and random files.

${C}
OPENFILE "data.dat" FOR RANDOM
SEEK "data.dat", 5
GETRECORD "data.dat", Student
PUTRECORD "data.dat", Student
CLOSEFILE "data.dat"
${C}

## Exception handling
Catches run-time errors (file not found, division by zero, invalid input) so the program doesn't crash.

${C}
try:
    f = open("data.txt")
except FileNotFoundError:
    print("File missing")
${C}

> Exam tip: always explain *why* an exception might occur in the context given.`]
    }
  ]
};

export default [AS, A];
