import { Suspense } from 'react';
import { TaskBoardContent } from '@/components/TaskBoardContent';

export const dynamic = 'force-dynamic';

export default function TaskBoardPage() {
  return (
    <Suspense fallback={
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <h1 className="font-display text-3xl text-text-primary mb-6">Task Board</h1>
        <div className="card p-8 text-center text-text-muted animate-pulse">Loading...</div>
      </div>
    }>
      <TaskBoardContent />
    </Suspense>
  );
}
