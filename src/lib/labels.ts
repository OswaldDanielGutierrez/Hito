export const projectStatusLabel = {
  development: "Desarrollo",
  qa: "QA",
  production: "Prod",
  delivered: "Entregado",
  on_hold: "En espera",
} as const;

export const taskStateLabel = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Hecha",
  blocked: "Bloqueada",
} as const;

export const taskStateNext = {
  pending: "in_progress",
  in_progress: "done",
  done: "blocked",
  blocked: "pending",
} as const;

export const priorityLabel = { high: "Alta", medium: "Media", low: "Baja" } as const;

export const resourceKindLabel = {
  document: "Documento",
  flow: "Flujo",
  code: "Código",
  link: "Enlace",
} as const;

export const healthLabel = {
  on_track: "Al día",
  at_risk: "En riesgo",
  late: "Atrasado",
  on_hold: "Detenido",
} as const;
