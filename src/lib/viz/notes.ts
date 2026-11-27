import "server-only";
/**
 * 🎓 Tutor-only teaching notes, one entry per step: what to say, what to ask, what to watch for.
 * Server-only: only ever sent to the tutor's browser.
 */
export type Note = { say: string[]; ask?: string[]; watch?: string };

export const NOTES: Record<string, Note[]> = {
  "cpu-fde": [
    { say: ["CPU = the brain that runs every program.", "Point at each part: CU (boss), ALU (calculator), registers (tiny, super-fast storage).", "Buses = the roads between the CPU and RAM."], ask: ["Where have you heard 'CPU' before? Phone, laptop, console…"] },
    { say: ["Von Neumann = stored program concept.", "Instructions (0–3) and data (4–5) sit in the SAME memory.", "The CPU fetches them one at a time."], ask: ["Why is it useful that programs live in memory? (load a different program = new job)"], watch: "Students who think the program lives inside the CPU." },
    { say: ["The PC holds the ADDRESS of the next instruction, not the instruction itself.", "It starts at 0."], ask: ["If PC = 0, which instruction runs first?"], watch: "Mixing up PC (address of next instruction) and CIR (the instruction itself)." },
    { say: ["Fetch starts: PC → MAR.", "MAR = Memory ADDRESS Register: holds the address we want."], ask: ["Before revealing: which bus carries addresses?"] },
    { say: ["Address bus: CPU → RAM (one way).", "Data bus brings LOAD 4 back into the MDR.", "MDR = Memory DATA Register."], ask: ["What do you think happens to the PC now?"], watch: "MAR = address, MDR = data. Say it twice." },
    { say: ["PC + 1, so it's ready for the next cycle.", "MDR → CIR: the CIR holds the instruction we're working on."], ask: ["Why increment now and not at the end?"] },
    { say: ["The CU decodes: works out what LOAD 4 means.", "Then it sends control signals (control bus) to make it happen."] },
    { say: ["LOAD needs DATA from memory, so we use MAR/MDR again.", "12 lands in the ACC (accumulator).", "Notice: data came from the SAME memory as instructions = von Neumann."], ask: ["Which register holds the result?"] },
    { say: ["The cycle repeats for every instruction.", "Quick version: PC → MAR → address bus → RAM → data bus → MDR → CIR, PC + 1."], ask: ["Get them to say the fetch steps out loud before the ordering task."] },
    { say: ["Decode: ADD 5 = add the data at address 5.", "30 is fetched into the MDR."], ask: ["Which part does the actual adding?"] },
    { say: ["ALU = Arithmetic Logic Unit: maths AND logic (comparisons, AND/OR).", "Result goes back into the ACC: 42."] },
    { say: ["STORE writes TO memory: data travels CPU → RAM on the data bus.", "Data bus = two-way. Address bus = one-way. Control bus = two-way (signals like read/write)."], ask: ["Which bus would carry the 'write' signal? (control)"] },
    { say: ["Exam favourites: clock speed, cores, cache.", "Clock speed = cycles per second (GHz).", "More cores = more instructions in parallel (if the software supports it).", "Bigger cache = fewer slow trips to RAM."], ask: ["Which would you upgrade for gaming and why?"], watch: "'More RAM makes the CPU faster': not one of the three CPU factors." },
  ],
  "control-lab": [
    { say: ["Control system = sensor → microprocessor → actuator.", "Real examples: greenhouses, street lights, alarms, washing machines, traffic lights."], ask: ["Name a control system at home."] },
    { say: ["Sensors only MEASURE: they never decide or act.", "List types: temperature, light, infrared/motion, pressure, moisture, gas, pH, sound."], watch: "'Heat sensor' should be 'temperature sensor' in exams." },
    { say: ["Real world = analogue. Computers = digital.", "ADC converts the sensor's analogue signal into binary."], ask: ["What would convert digital back to analogue? (DAC, e.g. for a motor)"] },
    { say: ["The microprocessor stores a PRESET value and compares readings against it.", "Reading < preset → heater ON."], ask: ["What if the reading is exactly 22?"] },
    { say: ["Actuator = output device that causes physical movement or action.", "Heater, motor, pump, valve, light, siren, buzzer."], watch: "Students calling the microprocessor or sensor an actuator." },
    { say: ["Feedback: the heater changes the temperature, which changes the next reading.", "It repeats continuously.", "Drag the slider up and down: show the heater switching at 22 °C."], ask: ["Why does it need to loop forever?"] },
    { say: ["Same pattern, different sensor + actuator.", "Slide the light level down: the lamp switches on below 30%."], ask: ["Why not just use a timer? (sunset changes; cloudy days)"] },
    { say: ["Infrared/motion sensor + siren.", "Slide the movement level: the siren triggers above 3."], ask: ["What else could the microprocessor do? (send a text, switch on lights)"] },
    { say: ["Monitoring = measure + record/display only.", "Control = measure + ACT using actuators.", "Exam: name the sensor, describe the comparison with a preset, name the actuator, mention it repeats continuously."] },
  ],
};
