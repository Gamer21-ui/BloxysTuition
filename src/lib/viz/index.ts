/** All visualizations. Add new ones here (data) and in components/viz/scenes.tsx (picture). */
import type { Viz } from "./types";
import { CPU_VIZ } from "./cpu";
import { CONTROL_VIZ } from "./control";

export const VIZZES = [CPU_VIZ, CONTROL_VIZ] as unknown as Viz[];
export const vizById = (id: string) => VIZZES.find((v) => v.id === id);
export const vizForChapter = (course: string, chapter: string) => VIZZES.filter((v) => v.course === course && v.chapter === chapter);
export const taskCount = (v: Viz) => v.steps.filter((s) => s.task).length;
