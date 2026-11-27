/**
 * Interactive visualizations ("viz") used for live lessons and self-paced replays.
 * A viz is a list of steps. Each step has a scene (whatever its Scene component needs)
 * and optionally a task. Pure data only: no React here, so scripts can read it too.
 */
export type Task =
  | { kind: "choice"; prompt: string; options: string[]; answer: number }
  | { kind: "order"; prompt: string; items: string[]; answer: number[] }   // items are shown shuffled; answer = item indexes in the right order
  | { kind: "tap"; prompt: string; targets: string[]; answer: string };   // tap a part of the scene; targets = tappable part ids

export type Step<S = Record<string, unknown>> = {
  title: string;
  caption: string;          // the student-facing explanation for this step
  scene: S;
  task?: Task;
  why?: string;             // shown after the task is answered / revealed
  sandbox?: boolean;        // the shared slider/controls are active on this step
};

export type Viz<S = Record<string, unknown>> = {
  id: string;
  course: string;           // course slug, e.g. "o-computer-science"
  chapter: string;          // chapter number as on the site
  title: string;
  emoji: string;
  blurb: string;
  steps: Step<S>[];
};

/** What a task answer looks like on the wire (and in live_keys). */
export const keyOf = (t: Task): unknown => t.answer;
export const isRight = (t: Task, a: unknown) => JSON.stringify(a) === JSON.stringify(t.answer);
