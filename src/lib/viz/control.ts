import type { Viz } from "./types";

export type Scenario = "greenhouse" | "street" | "alarm";
export type ControlScene = {
  scenario: Scenario;
  value: number;                  // default sensor reading (live: tutor can change it on sandbox steps)
  hi?: Array<"sensor" | "adc" | "mp" | "actuator" | "world" | "loop">;
  showLoop?: boolean;
  monitoring?: boolean;           // show a monitoring-only system (no actuator)
};

/** How each scenario behaves. on(value) decides whether the actuator is switched on. */
export const SCENARIOS: Record<Scenario, {
  name: string; sensor: string; sensorEmoji: string; actuator: string; actuatorEmoji: string; world: string;
  unit: string; min: number; max: number; preset: number; on: (v: number) => boolean; rule: string; fmt: (v: number) => string;
}> = {
  greenhouse: {
    name: "Greenhouse", sensor: "Temperature sensor", sensorEmoji: "🌡️", actuator: "Heater", actuatorEmoji: "🔥", world: "🌱",
    unit: "°C", min: 10, max: 35, preset: 22, on: (v) => v < 22, rule: "below 22 °C → heater ON", fmt: (v) => `${v} °C`,
  },
  street: {
    name: "Street lights", sensor: "Light sensor", sensorEmoji: "☀️", actuator: "Street lamp", actuatorEmoji: "💡", world: "🏙️",
    unit: "%", min: 0, max: 100, preset: 30, on: (v) => v < 30, rule: "light below 30% → lamp ON", fmt: (v) => `${v}% light`,
  },
  alarm: {
    name: "Burglar alarm", sensor: "Infrared (motion) sensor", sensorEmoji: "📡", actuator: "Siren", actuatorEmoji: "🚨", world: "🏠",
    unit: "", min: 0, max: 10, preset: 3, on: (v) => v > 3, rule: "movement above 3 → siren ON", fmt: (v) => `movement ${v}/10`,
  },
};

export const CONTROL_VIZ: Viz<ControlScene> = {
  id: "control-lab",
  course: "o-computer-science",
  chapter: "3",
  title: "Control Lab: Sensors, Microprocessors & Actuators",
  emoji: "🎛️",
  blurb: "Drive a greenhouse, street lights and a burglar alarm: sensor → ADC → microprocessor → actuator → feedback.",
  steps: [
    {
      title: "What is a control system?",
      caption: "A control system watches the world and DOES something about it. Sensors measure, a microprocessor decides, actuators act. Here: a greenhouse that keeps plants warm.",
      scene: { scenario: "greenhouse", value: 18, hi: ["sensor", "mp", "actuator"] },
    },
    {
      title: "Sensors measure",
      caption: "A sensor measures a physical property (temperature, light, movement, pressure…) and sends a reading. It does NOT make decisions.",
      scene: { scenario: "greenhouse", value: 18, hi: ["sensor"] },
      task: { kind: "choice", prompt: "Which sensor would a greenhouse use to keep the plants warm?", options: ["Light sensor", "Temperature sensor", "Pressure sensor", "Infrared sensor"], answer: 1 },
      why: "Warmth = temperature, so a temperature sensor.",
    },
    {
      title: "Analogue → Digital",
      caption: "Most sensors give an ANALOGUE signal. The microprocessor only understands DIGITAL (binary) data, so an ADC (analogue-to-digital converter) converts the reading.",
      scene: { scenario: "greenhouse", value: 18, hi: ["adc"] },
      task: { kind: "choice", prompt: "Why is an ADC needed between the sensor and the microprocessor?", options: ["The microprocessor only understands digital data", "To make the sensor more accurate", "To store the readings", "To power the heater"], answer: 0 },
      why: "Sensor readings are analogue; computers process digital (binary) data.",
    },
    {
      title: "The microprocessor decides",
      caption: "The microprocessor COMPARES the reading with a stored preset value (22 °C). If it's too cold, it sends a signal to switch the heater on.",
      scene: { scenario: "greenhouse", value: 18, hi: ["mp"] },
      task: { kind: "choice", prompt: "The reading is 18 °C and the preset is 22 °C. What does the microprocessor do?", options: ["Switches the heater ON", "Switches the heater OFF", "Does nothing", "Turns off the sensor"], answer: 0 },
      why: "18 is below 22, so it's too cold: the heater is switched ON.",
    },
    {
      title: "Actuators act",
      caption: "An ACTUATOR is an output device that makes something physically happen: a heater, motor, valve, pump, light or siren. The microprocessor switches it on or off.",
      scene: { scenario: "greenhouse", value: 18, hi: ["actuator"] },
      task: { kind: "tap", prompt: "Tap the ACTUATOR in this system.", targets: ["sensor", "adc", "mp", "actuator"], answer: "actuator" },
      why: "The heater is the actuator: it changes the real world (it warms the greenhouse).",
    },
    {
      title: "The feedback loop",
      caption: "The heater warms the greenhouse → the sensor measures again → the microprocessor compares again… This repeats CONTINUOUSLY. That's feedback: the output affects the next input. Move the slider!",
      scene: { scenario: "greenhouse", value: 18, hi: ["loop"], showLoop: true },
      sandbox: true,
      task: { kind: "order", prompt: "Put the control loop in the right order.", items: ["Sensor measures the temperature", "ADC converts the reading to digital", "Microprocessor compares it with the preset value", "Microprocessor switches the heater on or off"], answer: [0, 1, 2, 3] },
      why: "Sensor → ADC → microprocessor compares → actuator… and back to the sensor again.",
    },
    {
      title: "Street lights",
      caption: "Same idea, different sensor and actuator: a LIGHT sensor measures how bright it is. When it gets dark, the lamp turns on. Slide the light level.",
      scene: { scenario: "street", value: 70, hi: ["sensor", "actuator"] },
      sandbox: true,
      task: { kind: "choice", prompt: "At night the light level drops below the preset value. What happens?", options: ["The lamp switches ON", "The lamp switches OFF", "The light sensor switches off", "Nothing"], answer: 0 },
      why: "Too dark (below the preset) → the microprocessor switches the lamp ON.",
    },
    {
      title: "Burglar alarm",
      caption: "An infrared (motion) sensor detects movement. If movement is detected while the alarm is set, the microprocessor switches on the siren.",
      scene: { scenario: "alarm", value: 0, hi: ["sensor", "actuator"] },
      sandbox: true,
      task: { kind: "choice", prompt: "Which part is the ACTUATOR in a burglar alarm?", options: ["The infrared sensor", "The microprocessor", "The siren", "The keypad"], answer: 2 },
      why: "The siren makes something happen (noise): it's the actuator. The sensor only detects.",
    },
    {
      title: "Monitoring vs control",
      caption: "A MONITORING system only measures and records/displays readings: no actuators. A CONTROL system also acts on the readings using actuators.",
      scene: { scenario: "greenhouse", value: 24, monitoring: true, hi: ["sensor", "mp"] },
      task: { kind: "choice", prompt: "A weather station records the temperature and shows it on a screen. It has no actuators. It is a…", options: ["Monitoring system", "Control system"], answer: 0 },
      why: "No actuator = it only watches. That's monitoring.",
    },
  ],
};
