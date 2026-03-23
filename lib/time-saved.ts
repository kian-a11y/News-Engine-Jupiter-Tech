export function estimateTimeSaved(wordCount: number): number {
  const writingTime = Math.max(5, Math.min(45, wordCount * 0.12));
  const researchTime = 3;
  return Math.round(writingTime + researchTime);
}

export function getTimeSaved(): { minutes: number; outputs: number } {
  if (typeof window === "undefined") return { minutes: 0, outputs: 0 };
  const minutes = parseInt(localStorage.getItem("fx_time_saved_minutes") || "0", 10);
  const outputs = parseInt(localStorage.getItem("fx_outputs_generated") || "0", 10);
  return { minutes, outputs };
}

export function addTimeSaved(wordCount: number): { minutes: number; outputs: number } {
  const saved = estimateTimeSaved(wordCount);
  const current = getTimeSaved();
  const newMinutes = current.minutes + saved;
  const newOutputs = current.outputs + 1;
  localStorage.setItem("fx_time_saved_minutes", String(newMinutes));
  localStorage.setItem("fx_outputs_generated", String(newOutputs));
  return { minutes: newMinutes, outputs: newOutputs };
}

export function formatTimeSaved(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
