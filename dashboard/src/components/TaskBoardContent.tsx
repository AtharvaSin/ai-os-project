'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TaskRow } from './TaskRow';
import { KanbanBoard } from './KanbanBoard';
import { QuickAddTask } from './QuickAddTask';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { List, Columns, Plus, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'list' | 'kanban';

export function TaskBoardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tasks, setTasks] = useState<(Task & { project_name: string; project_slug: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const searchStr = searchParams.toString();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?${searchStr}`);
      const json = await res.json();
      setTasks(json.data ?? []);
    } catch {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [searchStr]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const activePriorities = searchParams.getAll('priority') as TaskPriority[];
  const activeStatuses = searchParams.getAll('status') as TaskStatus[];

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const toggleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchStr);
    const existing = params.getAll(key);
    if (existing.includes(value)) {
      params.delete(key);
      existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
    } else {
      params.append(key, value);
    }
    router.push(`/tasks?${params.toString()}`);
  };

  const priorities: TaskPriority[] = ['urgent', 'high', 'medium', 'low'];
  const statuses: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Task Board</h1>
          <p className="text-text-secondary text-sm mt-1">{tasks.length} tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn('btn-ghost p-2', view === 'list' && 'bg-hover text-accent-purple')}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={cn('btn-ghost p-2', view === 'kanban' && 'bg-hover text-accent-purple')}
            aria-label="Kanban view"
          >
            <Columns className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="card p-3 mb-6 flex flex-wrap items-center gap-2 sticky top-0 z-10">
        <span className="text-xs font-mono text-text-muted mr-2">Priority:</span>
        {priorities.map((p) => (
          <button
            key={p}
            onClick={() => toggleFilter('priority', p)}
            className={cn(
              'badge cursor-pointer transition-opacity',
              activePriorities.includes(p) ? 'opacity-100' : 'opacity-40',
              p === 'urgent' && 'bg-accent-red/15 text-accent-red',
              p === 'high' && 'bg-accent-gold/15 text-accent-gold',
              p === 'medium' && 'bg-accent-purple/15 text-accent-purple',
              p === 'low' && 'bg-accent-teal/15 text-accent-teal',
            )}
          >
            {p}
          </button>
        ))}

        <span className="text-xs font-mono text-text-muted ml-4 mr-2">Status:</span>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => toggleFilter('status', s)}
            className={cn(
              'badge cursor-pointer transition-opacity',
              activeStatuses.includes(s) ? 'opacity-100' : 'opacity-40',
              'bg-text-muted/15 text-text-secondary',
            )}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <Inbox className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-text-secondary text-sm">No tasks match your filters</p>
        </div>
      ) : view === 'list' ? (
        <div className="card overflow-hidden">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showProject
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <KanbanBoard tasks={tasks} onStatusChange={handleStatusChange} />
      )}

      {/* Quick Add FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-20 right-6 lg:bottom-8 lg:right-8 h-14 w-14 rounded-full bg-accent-purple text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-20"
        aria-label="Add task"
      >
        <Plus className="h-6 w-6" />
      </button>

      {showQuickAdd && (
        <QuickAddTask
          onClose={() => setShowQuickAdd(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
