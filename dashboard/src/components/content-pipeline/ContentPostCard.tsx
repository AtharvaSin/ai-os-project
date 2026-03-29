'use client';

import type { ContentPost } from '@/lib/types';
import { cn, contentPostStatusColor, contentPostStatusLabel, pillarLabel, pillarColor, filterLabel, filterColor, channelLabel, channelColor, formatDate } from '@/lib/utils';
import { Calendar, Image as ImageIcon, Hash, MessageSquare } from 'lucide-react';

/** Map channel names to display icons */
const CHANNEL_ICONS: Record<string, { icon: typeof MessageSquare; label: string }> = {
  instagram: { icon: ImageIcon, label: 'IG' },
  facebook: { icon: MessageSquare, label: 'FB' },
  twitter: { icon: Hash, label: 'X' },
  linkedin: { icon: MessageSquare, label: 'LI' },
};

interface ContentPostCardProps {
  post: ContentPost;
  onClick: () => void;
}

export function ContentPostCard({ post, onClick }: ContentPostCardProps) {
  return (
    <div
      className={cn(
        'card p-4 cursor-pointer transition-colors hover:bg-hover hover:border-accent-primary/30',
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Top: post_id + status badge */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-text-muted">{post.post_id}</span>
        <span className={cn('badge text-[10px]', contentPostStatusColor(post.status))}>
          {contentPostStatusLabel(post.status)}
        </span>
      </div>

      {/* Topic */}
      <h3 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
        {post.topic}
      </h3>

      {/* Taxonomy badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={cn('badge text-[10px]', pillarColor(post.content_pillar))}>
          {pillarLabel(post.content_pillar)}
        </span>
        {post.distillation_filter && (
          <span className={cn('badge text-[10px]', filterColor(post.distillation_filter))}>
            {filterLabel(post.distillation_filter)}
          </span>
        )}
        {post.content_channel && (
          <span className={cn('badge text-[10px]', channelColor(post.content_channel))}>
            {channelLabel(post.content_channel)}
          </span>
        )}
        {post.campaign && (
          <span className="text-[10px] text-text-muted truncate max-w-[120px]">
            {post.campaign}
          </span>
        )}
      </div>

      {/* Channels + image indicator */}
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        {/* Channel icons */}
        <div className="flex items-center gap-1.5">
          {post.channels.map(ch => {
            const config = CHANNEL_ICONS[ch];
            if (!config) return (
              <span key={ch} className="text-[10px] font-mono text-text-muted">{ch}</span>
            );
            const Icon = config.icon;
            return (
              <span
                key={ch}
                className="inline-flex items-center gap-0.5 text-[10px] text-text-muted"
                title={ch}
              >
                <Icon className="h-3 w-3" />
                {config.label}
              </span>
            );
          })}
        </div>

        {/* Image indicator */}
        {post.source_image_path && (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-accent-teal">
            <ImageIcon className="h-3 w-3" />
            img
          </span>
        )}
      </div>

      {/* Footer: scheduled date */}
      {post.scheduled_date && (
        <div className="mt-3 pt-2 border-t border-border flex items-center gap-1.5 text-[10px] text-text-muted">
          <Calendar className="h-3 w-3" />
          {formatDate(post.scheduled_date)}
          {post.scheduled_time && (
            <span className="font-mono">{post.scheduled_time}</span>
          )}
        </div>
      )}
    </div>
  );
}
