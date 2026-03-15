/* ── Enum types (match PostgreSQL enums exactly) ── */

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ArtifactType = 'document' | 'code' | 'config' | 'design' | 'media' | 'deployment' | 'other';

/* ── Database row types ── */

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  category: string | null;
  tech_stack: string[] | null;
  repo_url: string | null;
  live_url: string | null;
  owner: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: PhaseStatus;
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  phase_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  milestone_id: string | null;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  due_date: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  task_id: string | null;
  name: string;
  artifact_type: ArtifactType;
  file_path: string | null;
  url: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ProjectTag {
  id: string;
  project_id: string;
  tag: string;
  created_at: string;
}

/* ── Computed / API response types ── */

export type HealthColor = 'green' | 'gold' | 'red';

export interface ProjectWithHealth extends Project {
  open_task_count: number;
  overdue_task_count: number;
  health: HealthColor;
  next_milestone_name: string | null;
  next_milestone_date: string | null;
  tags: string[];
}

export interface PhaseWithProgress extends ProjectPhase {
  completed_milestones: number;
  total_milestones: number;
  milestones: MilestoneWithTasks[];
}

export interface MilestoneWithTasks extends Milestone {
  done_tasks: number;
  total_tasks: number;
  tasks: Task[];
}

export interface GanttPhase {
  id: string;
  project_id: string;
  project_name: string;
  name: string;
  status: PhaseStatus;
  started_at: string | null;
  completed_at: string | null;
  milestones: GanttMilestone[];
}

export interface GanttMilestone {
  id: string;
  name: string;
  status: MilestoneStatus;
  due_date: string | null;
}

export interface TaskFilters {
  project_id?: string;
  priority?: TaskPriority[];
  status?: TaskStatus[];
}

export interface CreateTaskPayload {
  title: string;
  project_id: string;
  milestone_id?: string;
  priority?: TaskPriority;
  due_date?: string;
  description?: string;
}
