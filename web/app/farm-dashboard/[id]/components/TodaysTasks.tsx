"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { F } from "@/lib/farmDashboard/theme";
import { trackEvent } from "@/lib/analytics/trackEvent";
import type { Task } from "@/lib/farmDashboard/types";

const TASK_LIMIT = 4;
const SEEN_TASKS_KEY_PREFIX = "whiskora_fd_seen_tasks_";

interface TodaysTasksProps {
  tasks: Task[];
  farmId: string;
}

/**
 * Renders the "Today's Tasks" action center and fires `task_completed` for any task that was
 * present on a previous visit but has since disappeared — i.e. the underlying data changed and
 * the task resolved itself. No manual "mark done" affordance exists; this is a pure diff against
 * the last-seen task id list cached in localStorage, purely for analytics visibility.
 */
export default function TodaysTasks({ tasks, farmId }: TodaysTasksProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleTasks = showAll ? tasks : tasks.slice(0, TASK_LIMIT);

  useEffect(() => {
    if (tasks.length === 0 && typeof window === "undefined") return;
    const key = `${SEEN_TASKS_KEY_PREFIX}${farmId}`;
    let previousIds: string[] = [];
    try {
      previousIds = JSON.parse(window.localStorage.getItem(key) || "[]");
    } catch {
      previousIds = [];
    }
    const currentIds = tasks.map((t) => t.id);
    const resolvedIds = previousIds.filter((id) => !currentIds.includes(id));
    resolvedIds.forEach((id) => {
      trackEvent({ eventName: "task_completed", entityType: "task", entityId: id, farmId: Number(farmId) });
    });
    try {
      window.localStorage.setItem(key, JSON.stringify(currentIds));
    } catch {
      // best-effort only
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.map((t) => t.id).join(","), farmId]);

  return (
    <section className="fd-sec">
      <div className="fd-sec-head">
        <div className="fd-sec-title">
          <img src="/icons/icon-calendar.png" alt="" />
          <h2 className="fd-sec-h">วันนี้</h2>
          {tasks.length > 0 && (
            <span
              className="fd-sec-badge"
              style={{
                background: tasks.some((t) => t.urgency === "overdue") ? F.redSoft : F.amberSoft,
                color: tasks.some((t) => t.urgency === "overdue") ? F.red : F.amber,
              }}
            >
              {tasks.length}
            </span>
          )}
        </div>
        {tasks.length > 0 && (
          <Link href={`/farm-dashboard/${farmId}/appointments`} className="fd-link-sm">
            ดูนัดหมาย
          </Link>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="fd-today-empty">
          <img src="/icons/icon-verified.png" alt="" />
          วันนี้ไม่มีงานเร่งด่วน ทุกอย่างเรียบร้อย
        </div>
      ) : (
        <>
          {visibleTasks.map((task) => (
            <div key={task.id} className={`fd-task-row fd-t-${task.urgency}`}>
              <div
                className="fd-task-icon"
                style={{
                  background:
                    task.urgency === "overdue" ? F.redSoft
                    : task.urgency === "today" ? F.amberSoft
                    : task.urgency === "upcoming" ? "#EFF6FF"
                    : "#F9FAFB",
                }}
              >
                <img src={task.icon} alt="" />
              </div>
              <div className="fd-task-dot" />
              <span className="fd-task-msg">{task.label}</span>
              <Link href={task.href} className="fd-task-btn">{task.action}</Link>
            </div>
          ))}
          {tasks.length > TASK_LIMIT && (
            <button className="fd-show-more" onClick={() => setShowAll((v) => !v)}>
              {showAll ? `ย่อ ▲` : `ดูทั้งหมด ${tasks.length} รายการ ▼`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
