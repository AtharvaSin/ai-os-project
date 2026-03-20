import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskPriority, TaskStatus, MilestoneStatus, PhaseStatus, ProjectStatus, HealthColor, RiskSeverity, RiskAlertType, PipelineRunStatus, ContentPostStatus } from './types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function priorityColor(p: TaskPriority): string {
  const map: Record<TaskPriority, string> = {
    urgent: 'bg-accent-red/15 text-accent-red',
    high: 'bg-accent-gold/15 text-accent-gold',
    medium: 'bg-accent-primary/15 text-accent-primary',
    low: 'bg-accent-teal/15 text-accent-teal',
  };
  return map[p];
}

export function statusColor(s: TaskStatus | MilestoneStatus | PhaseStatus | ProjectStatus): string {
  const map: Record<string, string> = {
    todo: 'bg-text-muted/15 text-text-muted',
    not_started: 'bg-text-muted/15 text-text-muted',
    pending: 'bg-text-muted/15 text-text-muted',
    planning: 'bg-text-muted/15 text-text-muted',
    in_progress: 'bg-accent-primary/15 text-accent-primary',
    active: 'bg-accent-teal/15 text-accent-teal',
    done: 'bg-accent-teal/15 text-accent-teal',
    completed: 'bg-accent-teal/15 text-accent-teal',
    blocked: 'bg-accent-red/15 text-accent-red',
    missed: 'bg-accent-red/15 text-accent-red',
    cancelled: 'bg-text-muted/15 text-text-muted',
    paused: 'bg-accent-gold/15 text-accent-gold',
    archived: 'bg-text-muted/15 text-text-muted',
  };
  return map[s] ?? 'bg-text-muted/15 text-text-muted';
}

export function healthCssColor(h: HealthColor): string {
  const map: Record<HealthColor, string> = {
    green: 'var(--accent-teal)',
    gold: 'var(--accent-gold)',
    red: 'var(--accent-red)',
  };
  return map[h];
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date(new Date().toDateString());
}

export function severityColor(s: RiskSeverity): string {
  const map: Record<RiskSeverity, string> = {
    critical: 'bg-[#FF6B6B]/15 text-[#FF6B6B]',
    high: 'bg-accent-gold/15 text-accent-gold',
    medium: 'bg-[#7B68EE]/15 text-[#7B68EE]',
    low: 'bg-text-muted/15 text-text-muted',
  };
  return map[s];
}

export function severityCssColor(s: RiskSeverity): string {
  const map: Record<RiskSeverity, string> = {
    critical: '#FF6B6B',
    high: '#E8B931',
    medium: '#7B68EE',
    low: '#807d75',
  };
  return map[s];
}

export function riskTypeLabel(t: RiskAlertType): string {
  const map: Record<RiskAlertType, string> = {
    overdue_cluster: 'Overdue Cluster',
    velocity_decline: 'Velocity Decline',
    milestone_slip: 'Milestone Slip',
    dependency_chain: 'Dependency Chain',
    stale_project: 'Stale Project',
  };
  return map[t];
}

export function pipelineRunStatusColor(s: PipelineRunStatus): string {
  const map: Record<PipelineRunStatus, string> = {
    success: 'bg-accent-teal/15 text-accent-teal',
    failed: 'bg-accent-red/15 text-accent-red',
    running: 'bg-accent-primary/15 text-accent-primary',
    cancelled: 'bg-text-muted/15 text-text-muted',
  };
  return map[s] ?? 'bg-text-muted/15 text-text-muted';
}

export function daysAgo(dateStr: string): number {
  const now = new Date();
  const then = new Date(dateStr);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export function contentPostStatusColor(s: ContentPostStatus): string {
  const map: Record<ContentPostStatus, string> = {
    planned: 'bg-text-muted/15 text-text-muted',
    prompt_ready: 'bg-[#7B68EE]/15 text-[#7B68EE]',
    awaiting_image: 'bg-accent-gold/15 text-accent-gold',
    image_uploaded: 'bg-accent-primary/15 text-accent-primary',
    rendered: 'bg-[#06B6D4]/15 text-[#06B6D4]',
    approved: 'bg-accent-teal/15 text-accent-teal',
    scheduled: 'bg-[#8B5CF6]/15 text-[#8B5CF6]',
    published: 'bg-accent-teal/15 text-accent-teal',
    failed: 'bg-accent-red/15 text-accent-red',
  };
  return map[s] ?? 'bg-text-muted/15 text-text-muted';
}

export function contentPostStatusLabel(s: ContentPostStatus): string {
  const map: Record<ContentPostStatus, string> = {
    planned: 'Planned',
    prompt_ready: 'Prompt Ready',
    awaiting_image: 'Awaiting Image',
    image_uploaded: 'Image Uploaded',
    rendered: 'Rendered',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
  };
  return map[s] ?? s;
}

export function pillarLabel(p: string): string {
  const map: Record<string, string> = {
    mesh_intel: 'Mesh Intel',
    personnel_file: 'Personnel File',
    flagged_query: 'Flagged Query',
    clearance_upgrade: 'Clearance Upgrade',
    world_window: 'World Window',
    character_spotlight: 'Character Spotlight',
    the_question: 'The Question',
    behind_the_build: 'Behind the Build',
    gateway_cta: 'Gateway CTA',
  };
  return map[p] ?? p;
}

export function pillarColor(p: string): string {
  const map: Record<string, string> = {
    mesh_intel: 'bg-[#C9DBEE]/15 text-[#C9DBEE]',
    personnel_file: 'bg-accent-gold/15 text-accent-gold',
    flagged_query: 'bg-[#F1C232]/15 text-[#F1C232]',
    clearance_upgrade: 'bg-accent-teal/15 text-accent-teal',
  };
  return map[p] ?? 'bg-text-muted/15 text-text-muted';
}
