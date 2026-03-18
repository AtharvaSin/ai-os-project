'use client';

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { PriorityPill } from './PriorityPill';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import type { Task, TaskStatus } from '@/lib/types';

interface KanbanBoardProps {
  tasks: (Task & { project_name?: string })[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'Todo', color: 'var(--text-muted)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--accent-primary)' },
  { id: 'blocked', label: 'Blocked', color: 'var(--accent-red)' },
  { id: 'done', label: 'Done', color: 'var(--accent-teal)' },
];

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    if (newStatus !== result.source.droppableId) {
      onStatusChange(result.draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="card p-3">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-xs font-mono text-text-secondary uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="text-xs font-mono text-text-muted ml-auto">{colTasks.length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-[100px] rounded-lg p-1 transition-colors',
                      snapshot.isDraggingOver && 'bg-hover',
                    )}
                  >
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              'rounded-lg border border-border p-3 bg-primary transition-shadow',
                              snapshot.isDragging && 'shadow-lg shadow-accent-primary/10',
                            )}
                          >
                            <p className="text-sm text-text-primary mb-2">{task.title}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {task.project_name && (
                                  <span className="text-[10px] font-mono text-accent-primary">
                                    {task.project_name}
                                  </span>
                                )}
                                <PriorityPill priority={task.priority} />
                              </div>
                              {task.due_date && (
                                <span className={cn(
                                  'text-[10px] font-mono',
                                  isOverdue(task.due_date) && task.status !== 'done'
                                    ? 'text-accent-red'
                                    : 'text-text-muted',
                                )}>
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
