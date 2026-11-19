import { diffDays, formatDayMonth } from "./dates";
import { currentPhase, finalDeliveryDate } from "./progress";
import type { PhaseInput } from "./types";

type NoticePhase = PhaseInput & { name: string };

/** Aviso ámbar del Resumen cuando la fase actual se movió respecto al plan original. */
export function scheduleNotice(phases: NoticePhase[]): string | null {
  const current = currentPhase(phases);
  if (!current?.estimatedDate || !current.originalDate || current.estimatedDate === current.originalDate) {
    return null;
  }

  const days = diffDays(current.originalDate, current.estimatedDate);
  const amount = Math.abs(days);
  const unit = amount === 1 ? "día" : "días";
  const direction = days > 0 ? "corrida" : "adelantada";

  const finalNow = finalDeliveryDate(phases);
  const finalOriginal = finalDeliveryDate(phases.map((p) => ({ estimatedDate: p.originalDate ?? p.estimatedDate })));
  const finalText = finalNow
    ? finalNow === finalOriginal
      ? ` La entrega final sigue estimada para el ${formatDayMonth(finalNow)}.`
      : ` La entrega final pasa a estar estimada para el ${formatDayMonth(finalNow)}.`
    : "";

  return `La fase ${current.name} va ${amount} ${unit} ${direction} respecto al plan inicial (${formatDayMonth(current.originalDate)}).${finalText}`;
}
