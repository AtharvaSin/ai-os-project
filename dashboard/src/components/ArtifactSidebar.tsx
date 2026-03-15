import { cn } from '@/lib/utils';
import type { Artifact, ArtifactType } from '@/lib/types';
import { FileText, Code, Settings, Palette, Film, Rocket, Package } from 'lucide-react';

interface ArtifactSidebarProps {
  artifacts: Artifact[];
  className?: string;
}

const typeIcons: Record<ArtifactType, typeof FileText> = {
  document: FileText,
  code: Code,
  config: Settings,
  design: Palette,
  media: Film,
  deployment: Rocket,
  other: Package,
};

const typeLabels: Record<ArtifactType, string> = {
  document: 'Documents',
  code: 'Code',
  config: 'Config',
  design: 'Design',
  media: 'Media',
  deployment: 'Deployment',
  other: 'Other',
};

export function ArtifactSidebar({ artifacts, className }: ArtifactSidebarProps) {
  const grouped = artifacts.reduce<Record<ArtifactType, Artifact[]>>((acc, a) => {
    (acc[a.artifact_type] ??= []).push(a);
    return acc;
  }, {} as Record<ArtifactType, Artifact[]>);

  return (
    <aside className={cn('w-full xl:w-72 shrink-0', className)}>
      <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
        Artifacts
      </h2>
      <div className="space-y-4">
        {Object.entries(grouped).map(([type, items]) => {
          const Icon = typeIcons[type as ArtifactType] ?? Package;
          return (
            <div key={type} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-4 w-4 text-accent-purple" />
                <h3 className="text-xs font-mono text-text-secondary uppercase">
                  {typeLabels[type as ArtifactType] ?? type}
                </h3>
              </div>
              <ul className="space-y-2">
                {items.map((a) => (
                  <li key={a.id}>
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent-purple hover:underline truncate block"
                      >
                        {a.name}
                      </a>
                    ) : (
                      <span className="text-sm text-text-secondary truncate block">
                        {a.name}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
