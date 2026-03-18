/* ── Enum types (match PostgreSQL enums exactly) ── */

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'missed';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ArtifactType = 'document' | 'code' | 'config' | 'design' | 'media' | 'deployment' | 'other';
export type RiskAlertType = 'overdue_cluster' | 'velocity_decline' | 'milestone_slip' | 'dependency_chain' | 'stale_project';
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PipelineCategory = 'B' | 'C';
export type PipelineRunStatus = 'success' | 'failed' | 'running' | 'cancelled';

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

/* ── Risk Engine types ── */

export interface RiskAlert {
  id: string;
  project_id: string;
  project_name?: string;
  project_slug?: string;
  alert_type: RiskAlertType;
  severity: RiskSeverity;
  title: string;
  description: string | null;
  affected_tasks: string[];
  affected_milestones: string[];
  score: number | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolution_note: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RiskSummary {
  total_active: number;
  critical_count: number;
  high_count: number;
  projects_affected: number;
  oldest_unresolved_days: number;
}

export interface VelocityDataPoint {
  date: string;
  project_name: string;
  project_slug: string;
  completed_count: number;
}

export interface RisksApiResponse {
  summary: RiskSummary;
  alerts: RiskAlert[];
  velocity: VelocityDataPoint[];
}

/* ── Pipeline Monitor types ── */

export interface Pipeline {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: PipelineCategory;
  schedule: string | null;
  is_active: boolean;
  notify_telegram: boolean;
  config: Record<string, unknown>;
  created_at: string;
}

export interface PipelineRun {
  id: string;
  pipeline_id: string;
  status: PipelineRunStatus;
  trigger_type: string;
  triggered_by: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_estimate_usd: number | null;
  output_summary: string | null;
  error_message: string | null;
}

export interface PipelineWithStats extends Pipeline {
  latest_run: PipelineRun | null;
  total_runs: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration_ms: number | null;
}

export interface PipelinesApiResponse {
  pipelines: PipelineWithStats[];
}

export interface PipelineRunsApiResponse {
  pipeline: Pipeline;
  runs: PipelineRun[];
}

/* ── Knowledge Health types ── */

export interface KnowledgeHealth {
  total_entries: number;
  with_embeddings: number;
  embedding_coverage_pct: number;
  domain_count: number;
  connection_count: number;
  last_ingestion: string | null;
}

/* ── Life Graph types ── */

export type LifeDomainStatus = 'active' | 'dormant' | 'archived';

export interface LifeDomain {
  id: string;
  slug: string;
  name: string;
  domain_number: string | null;
  path: string;
  level: number;
  status: LifeDomainStatus;
  parent_id: string | null;
  description: string | null;
  priority_weight: number;
  color_code: string | null;
  icon: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DomainWithCounts extends LifeDomain {
  active_tasks: number;
  overdue_tasks: number;
  active_objectives: number;
  active_automations: number;
  health_score: number | null;
  health_trend: 'up' | 'down' | 'stable' | null;
}

export interface DomainTreeNode extends DomainWithCounts {
  children: DomainTreeNode[];
}

export interface LifeGraphResponse {
  domains: DomainWithCounts[];
  summary: {
    total_domains: number;
    active_tasks: number;
    overdue_tasks: number;
    active_objectives: number;
  };
}

export interface DomainContextItem {
  id: string;
  domain_id: string;
  item_type: 'task' | 'objective' | 'automation';
  title: string;
  description: string | null;
  status: string;
  priority: string;
  target_date: string | null;
  progress_pct: number;
  completed_at: string | null;
  automation_config: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DomainHealthSnapshot {
  id: string;
  domain_id: string;
  snapshot_date: string;
  health_score: number;
  tasks_total: number;
  tasks_completed: number;
  tasks_overdue: number;
  objectives_total: number;
  objectives_progress: number;
  automations_active: number;
  velocity_7d: number;
  days_since_activity: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DomainDetailResponse {
  domain: LifeDomain;
  context_items: DomainContextItem[];
  tasks: (Task & { domain_name: string; domain_slug: string })[];
  health_snapshots: DomainHealthSnapshot[];
  breadcrumb: { depth: number; name: string; slug: string }[];
}

export interface CreateDomainPayload {
  name: string;
  slug: string;
  parent_id: string;
  domain_number?: string;
  description?: string;
  color_code?: string;
}

export interface CreateContextItemPayload {
  domain_id: string;
  item_type: 'objective' | 'automation';
  title: string;
  description?: string;
  priority?: TaskPriority;
  target_date?: string;
  automation_config?: Record<string, unknown>;
}

/* ── Capture System types ── */

export type CaptureType = 'idea' | 'epiphany' | 'memory_recall' | 'observation';
export type CaptureUrgency = 'low' | 'medium' | 'high';

export interface JournalEntry {
  id: string;
  content_preview: string;
  mood: string | null;
  energy_level: number | null;
  word_count: number | null;
  tags: string[];
  is_embedded: boolean;
  distilled_at: string | null;
  created_at: string;
  domain_name: string | null;
  domain_slug: string | null;
}

export interface QuickEntry {
  id: string;
  title: string;
  content_preview: string;
  domain: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  capture_type: CaptureType;
  urgency: CaptureUrgency;
  source_interface: string | null;
  analysed_at: string | null;
}

export interface CaptureStats {
  total_journals: number;
  journals_this_week: number;
  undistilled_journals: number;
  total_quick_entries: number;
  unprocessed_entries: number;
  entries_this_week: number;
  distilled_entries: number;
}
