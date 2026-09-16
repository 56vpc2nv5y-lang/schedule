import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const phaseSteps = [
  { label: "大纲", match: "大纲" },
  { label: "核算成本", match: "核算成本" },
  { label: "报价", match: "报价" },
  { label: "合同", match: "合同" },
  { label: "筹备", match: "筹备" },
  { label: "复核", match: "复核" },
] as const;

export function ProjectPhaseStepper({
  currentPhase,
  paused = false,
  className,
}: {
  currentPhase: string;
  paused?: boolean;
  className?: string;
}) {
  const matchedIndex = phaseSteps.findIndex((phase) => currentPhase.includes(phase.match));
  const currentIndex = paused
    ? phaseSteps.length - 1
    : matchedIndex >= 0
      ? matchedIndex
      : 0;

  return (
    <div className={cn("mb-5 overflow-x-auto pb-2", className)} data-project-phase-stepper>
      <ol className="flex min-w-[680px]" aria-label="项目阶段流程">
        {phaseSteps.map((phase, index) => {
          const done = index < currentIndex;
          const current = index === currentIndex;

          return (
            <li
              key={phase.label}
              className="relative flex flex-1 flex-col items-center px-1"
              aria-current={current ? "step" : undefined}
            >
              {index < phaseSteps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-4 h-0.5",
                    done ? "bg-[var(--status-done)]" : "bg-[var(--hairline)]",
                  )}
                />
              ) : null}
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-[var(--surface)] text-xs font-semibold",
                  done && "border-[var(--status-done)] bg-[var(--status-done-bg)] text-[var(--status-done)]",
                  current && "border-[var(--status-active)] bg-[var(--status-active-bg)] text-[var(--status-active)] shadow-sm",
                  !done && !current && "border-[var(--hairline)] text-[var(--ink-faint)]",
                )}
              >
                {done ? <Check className="h-4 w-4 stroke-[3]" /> : index + 1}
              </span>
              <span
                className={cn(
                  "mt-2 whitespace-nowrap text-xs font-semibold",
                  done && "text-[var(--status-done)]",
                  current && "text-[var(--status-active)]",
                  !done && !current && "text-[var(--ink-faint)]",
                )}
              >
                {phase.label}
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                {done ? "已完成" : current ? "当前阶段" : "未开始"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
