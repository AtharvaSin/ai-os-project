'use client';

import { useEffect, useState, useCallback } from 'react';
import { TaskRow } from './TaskRow';
import type { Task, TaskStatus } from '@/lib/types';
import { Inbox } from 'lucide-react';

export function TodayTasks() {
  const [tasks, setTasks] = useState<(Task & { project_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks?filter=today');
      const json = await res.json();
      setTasks(json.data ?? []);
    } catch {
      console.error('Failed to fetch today tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  if (loading) {
    return <div className="card p-8 text-center text-text-muted animate-pulse">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Inbox className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-secondary text-sm">No tasks due today</p>
      </div>
    );
  }

  return (
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
  );
}
