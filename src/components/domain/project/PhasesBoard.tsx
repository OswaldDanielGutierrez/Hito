"use client";

import { Plus } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import {
  addTask,
  completePhase,
  reopenPhase,
  setTaskState,
  type ActionResult,
} from "@/app/(app)/proyectos/[id]/actions";
import { Button } from "@/components/ui/Button";
import type { PhaseData, ResourceData, TaskData } from "@/lib/data/project";
import { currentPhase } from "@/lib/domain/progress";
import { taskStateLabel, taskStateNext } from "@/lib/labels";
import { taskStateColors } from "@/lib/ui-colors";
import { EditPhaseDateDialog, NewPhaseDialog } from "./PhaseDialogs";
import { PhaseGroup } from "./PhaseGroup";
import { TaskDetailSheet } from "./TaskDetailSheet";

type Op = { type: "state"; id: string; state: TaskData["state"] } | { type: "add"; task: TaskData };

function reduce(tasks: TaskData[], op: Op): TaskData[] {
  if (op.type === "state") return tasks.map((t) => (t.id === op.id ? { ...t, state: op.state } : t));
  return [...tasks, op.task];
}

export function PhasesBoard({
  projectId,
  phases,
  tasks: serverTasks,
  resources,
  today,
}: {
  projectId: string;
  phases: PhaseData[];
  tasks: TaskData[];
  resources: ResourceData[];
  today: string;
}) {
  const [tasks, applyOptimistic] = useOptimistic(serverTasks, reduce);
  const [, startTransition] = useTransition();
  const current = currentPhase(phases);

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const idx = current ? phases.findIndex((p) => p.id === current.id) : -1;
    return Object.fromEntries(phases.map((p, i) => [p.id, idx >= 0 && (i === idx || i === idx + 1)]));
  });
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [editingPhase, setEditingPhase] = useState<PhaseData | null>(null);
  const [newPhaseOpen, setNewPhaseOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, optimistic?: Op) {
    startTransition(async () => {
      if (optimistic) applyOptimistic(optimistic);
      const result = await action();
      setError(result.ok ? null : result.error);
    });
  }

  function cycleState(task: TaskData) {
    const next = taskStateNext[task.state];
    run(() => setTaskState({ taskId: task.id, state: next }), { type: "state", id: task.id, state: next });
  }

  function addTaskTo(phaseId: string, title: string) {
    const task: TaskData = {
      id: `temp-${crypto.randomUUID()}`,
      phaseId,
      parentTaskId: null,
      title,
      description: null,
      state: "pending",
      priority: "medium",
      dueDate: null,
      estimatedHours: null,
      blockedReason: null,
      position: Number.MAX_SAFE_INTEGER,
      linkedResourceIds: [],
    };
    run(() => addTask({ phaseId, title }), { type: "add", task });
  }

  function startNewTask() {
    if (!current) return;
    setOpen((o) => ({ ...o, [current.id]: true }));
    setAddingIn(current.id);
  }

  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const lastDate = phases.reduce<string | null>(
    (max, p) => (p.estimatedDate && (!max || p.estimatedDate > max) ? p.estimatedDate : max),
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button className="flex-1 sm:flex-none" onClick={startNewTask} disabled={!current}>
          <Plus size={18} strokeWidth={1.9} aria-hidden />
          Nueva tarea
        </Button>
        <Button className="flex-1 sm:flex-none" variant="secondary" onClick={() => setNewPhaseOpen(true)}>
          <Plus size={18} strokeWidth={1.9} aria-hidden />
          Nueva fase
        </Button>
        <p className="basis-full text-[13px] text-muted lg:basis-auto">
          Toca el estado de una tarea para cambiarlo. Toca el nombre de una fase para plegarla.
        </p>
        <ul aria-label="Leyenda de estados" className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 lg:ml-auto lg:w-auto">
          {(Object.keys(taskStateLabel) as (keyof typeof taskStateLabel)[]).map((state) => (
            <li key={state} className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <span aria-hidden className="size-3 rounded-[3px]" style={{ backgroundColor: taskStateColors[state].bg }} />
              {taskStateLabel[state]}
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <p role="alert" className="rounded-button bg-[#FDECEA] px-3.5 py-2.5 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {phases.length === 0 ? (
        <p className="rounded-card border border-line bg-white p-5 text-sm text-muted">
          Este proyecto aún no tiene fases. Agrega la primera con «Nueva fase».
        </p>
      ) : (
        phases.map((phase, i) => (
          <PhaseGroup
            key={phase.id}
            phase={phase}
            index={i}
            isCurrent={phase.id === current?.id}
            open={open[phase.id] ?? false}
            tasks={topLevel.filter((t) => t.phaseId === phase.id)}
            today={today}
            adding={addingIn === phase.id}
            onToggle={() => setOpen((o) => ({ ...o, [phase.id]: !o[phase.id] }))}
            onStartAdd={() => setAddingIn(phase.id)}
            onStopAdd={() => setAddingIn(null)}
            onAddTask={(title) => addTaskTo(phase.id, title)}
            onCycleState={cycleState}
            onOpenTask={(t) => setSelectedTaskId(t.id)}
            onEditDate={() => setEditingPhase(phase)}
            onComplete={() => run(() => completePhase({ phaseId: phase.id }))}
            onReopen={() => run(() => reopenPhase({ phaseId: phase.id }))}
          />
        ))
      )}

      {editingPhase && (
        <EditPhaseDateDialog
          key={editingPhase.id}
          phase={editingPhase}
          followingCount={
            phases.filter((p) => p.position > editingPhase.position && p.status !== "completed" && p.estimatedDate).length
          }
          onClose={() => setEditingPhase(null)}
        />
      )}
      {newPhaseOpen && <NewPhaseDialog projectId={projectId} lastDate={lastDate} onClose={() => setNewPhaseOpen(false)} />}
      {selectedTask && !selectedTask.id.startsWith("temp-") && (
        <TaskDetailSheet key={selectedTask.id} task={selectedTask} resources={resources} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
