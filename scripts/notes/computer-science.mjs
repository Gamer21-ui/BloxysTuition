// O Level Computer Science 2210 starter notes, one string per syllabus part.
const C = "\x60\x60\x60"; // code fence
export default {
  "1": [
`## Number systems
Computers use **binary** (base 2) because circuits have two states: on/off.

| System | Base | Digits | Use |
|---|---|---|---|
| Denary | 10 | 0–9 | Humans |
| Binary | 2 | 0, 1 | Computers |
| Hexadecimal | 16 | 0–9, A–F | Shorter way to show binary (colour codes, MAC addresses, error codes) |

## Converting
- **Denary → binary**: use place values 128 64 32 16 8 4 2 1. 45 = 32 + 8 + 4 + 1 = **0010 1101**
- **Binary → hex**: split into nibbles (4 bits). 1111 1010 → F A = **FA**
- **Hex → denary**: 3C = 3×16 + 12 = **60**

## Binary addition
0+0=0, 0+1=1, 1+1=10 (write 0 carry 1), 1+1+1=11. A result over 8 bits causes **overflow**.

## Logical shifts
Left shift doubles each place (×2 per shift); right shift halves. Bits shifted out are lost.

## Two's complement (negative numbers)
The leftmost bit is worth −128. To get −5: write +5 (0000 0101), flip the bits (1111 1010), add 1 → **1111 1011**.

> Exam tip: show your working in columns. Method marks are available.`,
`## Representing text, sound and images
## Text
Each character has a binary code from a **character set**.
- **ASCII**: 7/8 bits, English characters only
- **Unicode**: more bits per character, covers most world languages and emojis, so files are larger

## Sound
Sound waves are **sampled** at regular intervals.
- **Sample rate**: samples per second. Higher = more accurate, bigger file.
- **Sample resolution**: bits per sample. Higher = more accurate, bigger file.

## Images
Bitmap images are made of **pixels**.
- **Resolution**: number of pixels (width × height)
- **Colour depth**: bits per pixel. 1 bit = 2 colours, 8 bits = 256 colours, 24 bits ≈ 16.7 million.

**Image file size (bits) = width × height × colour depth**
e.g. 100 × 50 × 8 = 40 000 bits = **5 000 bytes**

> Exam tip: convert bits → bytes (÷8) → KiB (÷1024) as the question asks.`,
`## Data storage and compression
## Units
| Unit | Size |
|---|---|
| Bit | 0 or 1 |
| Nibble | 4 bits |
| Byte | 8 bits |
| KiB | 1024 bytes |
| MiB | 1024 KiB |
| GiB | 1024 MiB |
| TiB | 1024 GiB |

## Why compress
Smaller files use less storage, transfer faster and use less bandwidth.

## Lossy
Permanently removes data the user is unlikely to notice. Much smaller files, but the original can't be restored. Examples: **JPEG**, **MP3**, reducing resolution or colour depth.

## Lossless
The original can be **restored exactly**. Needed for text and program files. Example: **run-length encoding (RLE)**: "AAAABBB" → 4A 3B.

> Exam tip: say WHICH data a method removes (e.g. sounds humans can't hear in MP3).`,
  ],
  "2": [
`## Data transmission
Data is split into **packets**:
- **Header**: destination and source IP address, packet number
- **Payload**: the actual data
- **Trailer**: end marker, error check

**Packet switching**: packets take different routes (via **routers**) and are reassembled in order at the destination.

## Methods
| | Serial | Parallel |
|---|---|---|
| How | One bit at a time, one wire | Several bits at once, several wires |
| Distance | Long | Short (skew: bits arrive out of sync) |
| Example | USB | Inside computers (older printers) |

## Direction
- **Simplex**: one way only (to a printer)
- **Half-duplex**: both ways, not at the same time (walkie-talkie)
- **Full-duplex**: both ways at once (phone call)

**USB**: serial, plug and play, powers devices, standard connector.

> Exam tip: justify each method for the scenario in the question.`,
`## Error detection
Data can be corrupted by interference.

| Method | How it works |
|---|---|
| **Parity check** | Extra bit makes the number of 1s even (or odd). A wrong count means an error. Can't spot two flipped bits. |
| **Parity block** | Parity by row and column, so it can locate the flipped bit |
| **Checksum** | Value calculated from the data is sent; the receiver recalculates and compares |
| **Echo check** | Receiver sends the data back; the sender compares |
| **Check digit** | Last digit calculated from the others (ISBN, barcodes). Catches typing errors. |
| **ARQ** | Receiver sends an acknowledgement; if none arrives before a **timeout**, the data is resent |

> Exam tip: be able to find the error in a parity question: count the 1s in each byte.`,
`## Encryption
Encryption scrambles data (**plaintext → ciphertext**) so that intercepted data can't be understood. It doesn't stop interception.

## Symmetric encryption
The same key encrypts and decrypts. Fast, but the key must be shared securely.

## Asymmetric encryption
A **public key** (shared with anyone) encrypts; a matching **private key** (kept secret) decrypts. Solves the key-sharing problem. Used in HTTPS.

> Exam tip: "who holds which key?" The receiver's public key encrypts; only the receiver's private key decrypts.`,
  ],
  "3": [
`## Computer architecture
**Von Neumann architecture**: data and instructions are stored together in memory.

## CPU components
- **ALU**: calculations and logic
- **Control unit (CU)**: decodes instructions and sends control signals
- **Registers**:
  - **PC** (program counter): address of the next instruction
  - **MAR**: address being read from or written to
  - **MDR**: data being transferred
  - **CIR**: current instruction
  - **ACC** (accumulator): results from the ALU
- **Buses**: address bus (one-way), data bus, control bus

## Fetch–decode–execute cycle
1. PC → MAR; the address goes along the address bus
2. Instruction → MDR → CIR; PC increments
3. CU decodes; the instruction is executed

## Performance
**Clock speed** (more cycles per second), **number of cores** (parallel work), **cache size** (fast memory near the CPU).

**Embedded systems**: a computer inside a larger device for one task (washing machine, microwave).

**Instruction set**: the list of machine-code commands a CPU understands.

> Exam tip: name the register AND what it holds.`,
`## Input and output devices
## Input
Keyboard, mouse, microphone, touch screen (resistive / capacitive / infra-red), 2D and 3D scanners, barcode and QR code scanners, digital camera.

## Output
Monitor (LCD/LED), printers (**inkjet**, **laser**, **3D**), speakers, projectors (DLP/LCD), **actuators** (motors, valves).

## Sensors
Measure physical quantities and send data to a microprocessor: **temperature, light, pressure, moisture, humidity, gas, infra-red (motion), acoustic, pH, accelerometer, proximity, level, magnetic field**.

| Device | How it works (key point) |
|---|---|
| Laser printer | Drum charged, toner attracted, fused by heat |
| Inkjet printer | Tiny droplets sprayed (thermal bubble or piezo) |
| Barcode scanner | Laser reflects off bars; sensor reads pattern |
| Capacitive screen | Detects change in electrical field from a finger |

> Exam tip: match the sensor to the scenario and say what it measures.`,
`## Data storage
## Primary storage
- **RAM**: volatile, read/write, holds programs and data in use
- **ROM**: non-volatile, read-only, holds the boot-up instructions (BIOS)

## Secondary storage
| Type | Examples | Notes |
|---|---|---|
| **Magnetic** | Hard disk drive | Large and cheap, moving parts |
| **Solid state** | SSD, USB flash drive, SD card | No moving parts, fast, robust |
| **Optical** | CD, DVD, Blu-ray | Laser reads pits and lands; portable |

**Virtual memory**: when RAM is full, part of secondary storage is used as extra RAM (slower).

## Cloud storage
Data stored on remote servers over the internet.
- **Benefits**: access anywhere, automatic backup, scalable
- **Drawbacks**: needs internet, security and privacy concerns, ongoing cost

> Exam tip: recommend storage by considering capacity, speed, portability, durability and cost.`,
`## Network hardware
- **NIC** (network interface card): connects a device to a network; has a **MAC address**
- **MAC address**: unique 48-bit address set by the manufacturer, usually shown in hex
- **IP address**: identifies a device on a network and can change.
  - **IPv4**: 32 bits, four numbers 0–255 (192.168.1.10)
  - **IPv6**: 128 bits in hex, many more addresses
  - **Static** (fixed) vs **dynamic** (assigned each time)
- **Router**: forwards packets between networks using IP addresses; assigns local IP addresses

> Exam tip: MAC = physical and fixed; IP = logical and can change.`,
  ],
  "4": [
`## Software and interrupts
## Types of software
- **System software**: runs the computer: **operating system**, utilities (antivirus, defragmenter, backup), drivers
- **Application software**: does user tasks: word processor, spreadsheet, browser, games

## Operating system functions
Manage files, memory, peripherals and drivers, multitasking, security (user accounts), the user interface, interrupts.

**Firmware**: software in ROM that starts the hardware (bootloader).

## Interrupts
A signal to the processor that something needs attention: a key press, mouse click, printer out of paper, a timer, a software error (divide by zero).
1. The current task is paused and its state saved
2. The **interrupt service routine (ISR)** runs
3. The original task resumes

> Exam tip: give a hardware and a software example of an interrupt.`,
`## Languages, translators and IDEs
## High- vs low-level languages
| High-level | Low-level |
|---|---|
| English-like, easy to read and debug | Assembly or machine code |
| Portable across machines | Machine-specific |
| Must be translated | Direct hardware control, efficient |

## Translators
| | Compiler | Interpreter | Assembler |
|---|---|---|---|
| Translates | Whole program at once | One line at a time | Assembly → machine code |
| Output | Executable file | No executable | Machine code |
| Errors | Reported after the whole program | Stops at the first error | |
| Speed | Fast to run | Slower | |

## IDE features
Code editor, **run-time environment**, **translator**, **error diagnostics**, **auto-completion**, **auto-correction**, **prettyprint** (colour-coding, indentation).

> Exam tip: compilers suit finished programs; interpreters suit development and debugging.`,
  ],
  "5": [
`## The internet and the web
- **Internet**: the global network of networks (the infrastructure)
- **World Wide Web**: web pages and resources accessed over the internet

## URL
Protocol + domain name + file path, e.g. https://www.example.com/page.html

## How a page loads
1. The browser asks a **DNS** server for the IP address of the domain
2. DNS returns the IP address
3. The browser requests the page from the **web server**
4. The server sends the HTML, which the browser **renders**

## HTTP vs HTTPS
HTTPS uses **SSL/TLS** encryption (padlock icon).

## Cookies
Small text files a website stores on your computer: **session** (deleted when the browser closes) or **persistent** (logins, preferences, tracking).

**Browser functions**: render HTML, bookmarks, history, tabs, store cookies, a navigation bar.

> Exam tip: explain DNS as a step-by-step sequence.`,
`## Digital currency
Money that exists only electronically (no physical coins or notes), e.g. cryptocurrencies.

## Blockchain
A **decentralised** digital ledger of transactions.
- Each **block** stores transactions, a timestamp, its own **hash** and the **previous block's hash**
- Changing a block changes its hash and breaks the chain, so tampering is obvious
- Copies are held by many computers (no single owner)

## Uses
Cryptocurrency, tracking supply chains, smart contracts.

> Exam tip: the key point is that every block holds the previous block's hash.`,
`## Cyber security
## Threats
| Threat | What it is |
|---|---|
| **Brute-force attack** | Trying many passwords until one works |
| **Data interception** | Capturing data in transit (packet sniffing) |
| **DDoS** | Flooding a server with traffic from many computers so it can't serve real users |
| **Hacking** | Unauthorised access |
| **Malware** | Virus, worm, Trojan, spyware, adware, ransomware |
| **Phishing** | Fake emails or messages that trick users into giving details |
| **Pharming** | Malicious code or DNS changes that redirect to a fake site |
| **Social engineering** | Manipulating people to reveal information |

## Protection
Anti-malware, **firewalls**, **proxy servers**, strong passwords and **two-step verification**, biometrics, access levels, **encryption**, automatic software updates, SSL/TLS, checking URLs and spellings, privacy settings, staff training.

> Exam tip: for each threat give one specific prevention method.`,
  ],
  "6": [
`## Automated systems
**Sensors → microprocessor → actuators**
1. A sensor takes a reading (analogue → converted to digital by an **ADC**)
2. The microprocessor **compares** it with stored values
3. If outside the range, it signals an **actuator** (motor, valve, heater)
4. Repeats continuously

## Uses
Industry, transport (traffic lights, autopilot), agriculture (irrigation), weather stations, gaming, lighting, science.

| Advantages | Disadvantages |
|---|---|
| Works 24/7, faster and consistent | Expensive to set up and maintain |
| Safer (dangerous tasks) | Can fail or be hacked |
| Fewer human errors | Job losses |

> Exam tip: describe the loop using the scenario's sensor and actuator.`,
`## Robotics
A **robot** is a programmable machine with a **mechanical structure**, **electrical components** (sensors, motors, a microprocessor) and is **programmable**.

## Uses
Manufacturing (welding, painting), transport (driverless cars, drones), agriculture (harvesting), medicine (surgery), domestic (vacuum cleaners), warehouses, exploration.

| Advantages | Disadvantages |
|---|---|
| Work continuously, precise and consistent | High cost |
| Dangerous or repetitive tasks | Need maintenance and programming |
| Higher productivity | Job losses; can't easily handle unusual situations |

> Exam tip: robots don't have to look human. Focus on the three characteristics.`,
`## Artificial intelligence (AI)
AI is the simulation of intelligent behaviour by computers. Main characteristics: **collecting data, applying rules, and adapting (learning)**.

## Expert systems
Copy the knowledge of a human expert (medical diagnosis, car fault-finding). Made of:
- **Knowledge base**: facts
- **Rule base**: IF … THEN rules
- **Inference engine**: applies the rules to the facts to reach conclusions
- **User interface**: asks questions and shows results

## Machine learning
The program improves its performance from data without being explicitly reprogrammed, e.g. spam filters, recommendations, image recognition.

**Concerns**: bias in training data, job losses, privacy, decisions that are hard to explain.

> Exam tip: name all four parts of an expert system and their jobs.`,
  ],
  "7": [
`## Algorithm design and problem-solving
## Program development life cycle
**Analysis** (abstraction, decomposition, requirements) → **Design** (structure diagrams, flowcharts, pseudocode) → **Coding** → **Testing**

- **Abstraction**: remove unnecessary detail
- **Decomposition**: break the problem into smaller parts

## Standard methods
Linear search, bubble sort, totalling, counting, finding max/min/average.

${C}
Total ← 0
FOR Index ← 1 TO 10
    Total ← Total + Marks[Index]
NEXT Index
OUTPUT "Average: ", Total / 10
${C}

## Validation (is the data sensible?)
Range, length, type, presence, format, check digit.

## Verification (was it entered correctly?)
Double entry, visual check.

## Test data
**Normal** (valid), **abnormal** (should be rejected), **extreme** (largest/smallest valid), **boundary** (edges: just inside and just outside).

## Errors and trace tables
Use a **trace table** to dry-run an algorithm and find **logic errors**.

Flowchart symbols: terminator (start/stop), process (rectangle), input/output (parallelogram), decision (diamond).

> Exam tip: in pseudocode, use the Cambridge keywords exactly (FOR, NEXT, IF…THEN…ENDIF, WHILE…ENDWHILE).`,
  ],
  "8": [
`## Variables and constants
Variables hold values that can change; constants don't. Use meaningful identifiers.

## Data types
INTEGER, REAL, CHAR, STRING, BOOLEAN.

## Sequence, selection, iteration
${C}
IF Score >= 50 THEN
    OUTPUT "Pass"
ELSE
    OUTPUT "Fail"
ENDIF

FOR Count ← 1 TO 5            // count-controlled
    OUTPUT Count
NEXT Count

WHILE Password <> "secret" DO // pre-condition (may run 0 times)
    INPUT Password
ENDWHILE

REPEAT                        // post-condition (runs at least once)
    INPUT Age
UNTIL Age > 0
${C}

## Operators
Arithmetic: + − * / ^ **MOD** (remainder) **DIV** (whole-number division).
Logical: AND, OR, NOT.

## String handling
LENGTH, SUBSTRING, UCASE, LCASE.

## Procedures and functions
Reusable blocks; **functions return a value**. **Parameters** pass data in. **Local** variables exist only inside the module; **global** variables anywhere.

> Exam tip: 17 MOD 5 = 2 and 17 DIV 5 = 3. Learn both.`,
`## Arrays
An array stores many values of the **same data type** under one identifier, accessed by an **index**.

${C}
DECLARE Names : ARRAY[1:5] OF STRING
Names[1] ← "Ava"

DECLARE Grid : ARRAY[1:3, 1:4] OF INTEGER   // 3 rows × 4 columns = 12 elements
Grid[2, 3] ← 7
${C}

## Using arrays with loops
${C}
Highest ← Scores[1]
FOR i ← 2 TO 30
    IF Scores[i] > Highest THEN
        Highest ← Scores[i]
    ENDIF
NEXT i
${C}

Nested loops handle 2D arrays (outer loop: rows; inner loop: columns).

> Exam tip: check the array bounds. Starting at 0 or 1 matters in loops.`,
`## File handling
Files store data **permanently**, so it is still there after the program ends.

${C}
OPENFILE "scores.txt" FOR WRITE
WRITEFILE "scores.txt", Name
CLOSEFILE "scores.txt"

OPENFILE "scores.txt" FOR READ
READFILE "scores.txt", Line
CLOSEFILE "scores.txt"
${C}

- **WRITE** overwrites the file; **APPEND** adds to the end (in some languages)
- Always **close** the file after use

> Exam tip: give a reason for storing data in a file: "so the data is kept when the program is closed".`,
  ],
  "9": [
`## Databases
A **single-table database** stores data about one thing.

- **Table**: the whole set of records
- **Record**: one row (all the data about one item)
- **Field**: one column (one attribute)
- **Primary key**: a field with a **unique** value for every record (e.g. StudentID)

## Data types
Text/alphanumeric, character, Boolean, integer, real, date/time. Phone numbers are **text** (they keep leading zeros and aren't used in calculations).

## Validation in databases
Range, length, type, presence and format checks stop bad data being entered.

## SQL
${C}
SELECT Name, Age
FROM Students
WHERE Age > 16 AND Town = 'Flacq'
ORDER BY Name ASC;

SELECT COUNT(*) FROM Students WHERE Age > 16;
SELECT SUM(Price) FROM Products;
${C}

| Keyword | Does |
|---|---|
| SELECT | Fields to show |
| FROM | Table |
| WHERE | Conditions |
| ORDER BY | Sort (ASC/DESC) |
| SUM / COUNT | Total / number of records |

> Exam tip: put text values in quotes and end SQL statements with a semicolon.`,
  ],
  "10": [
`## Boolean logic
| Gate | Output is 1 when… |
|---|---|
| **NOT** | Input is 0 (it inverts) |
| **AND** | All inputs are 1 |
| **OR** | At least one input is 1 |
| **NAND** | NOT AND: any input is 0 |
| **NOR** | NOT OR: all inputs are 0 |
| **XOR** | Inputs are different |

## Truth tables
2 inputs → 4 rows; 3 inputs → 8 rows (2ⁿ). List inputs in binary order: 000, 001, 010, …

## Logic expressions
Read the problem statement carefully:
"The alarm (X) sounds if the door is open (D) AND the system is armed (A), OR smoke is detected (S)"
→ **X = (D AND A) OR S**

## Working through a circuit
Label the output of each gate, add a column for each in the truth table, and finish with X.

> Exam tip: add an extra column for each intermediate gate output. It stops mistakes and earns working marks.`,
  ],
};
