import React from 'react';
import { cn } from "@/lib/utils";

// Section Component
export const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
    <div className="bg-gradient-to-r from-muted/50 to-muted/70 px-5 py-3 border-b border-border">
      <h3 className="font-bold text-foreground flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

// MetaBadge Component
export const MetaBadge = ({ label, value, variant = 'default' }: { label: string; value?: string; variant?: 'default' | 'success' | 'info' }) => {
  const colors = {
    default: 'bg-muted/50 text-muted-foreground border-border',
    success: 'bg-primary/10 text-primary border-primary/20',
    info: 'bg-secondary/10 text-secondary-foreground border-secondary/20'
  };

  return (
    <div className={cn('border rounded-lg p-3', colors[variant])}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className="text-sm font-semibold">{value || 'N/A'}</p>
    </div>
  );
};

// DefinitionCard Component
export const DefinitionCard = ({ title, content, variant = 'default' }: { title: string; content?: string; variant?: 'default' | 'secondary' | 'accent' }) => {
  const colors = {
    default: 'from-muted/30 to-muted/50 border-border',
    secondary: 'from-muted/50 to-muted/70 border-border',
    accent: 'from-primary/5 to-primary/10 border-border'
  };

  return (
    <div className={cn('bg-gradient-to-br border rounded-lg p-4', colors[variant])}>
      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{title}</p>
      <p className="text-sm text-foreground leading-relaxed">{content || 'N/A'}</p>
    </div>
  );
};

// InfoCard Component
export const InfoCard = ({ label, value, variant = 'default' }: { label: string; value?: string; variant?: 'default' | 'blue' | 'green' | 'purple' }) => {
  const colors = {
    default: 'bg-muted/30 border-border',
    blue: 'bg-primary/10 border-primary/20',
    green: 'bg-secondary/10 border-secondary/20',
    purple: 'bg-accent/10 border-accent/20'
  };

  return (
    <div className={cn('border rounded-lg p-4', colors[variant])}>
      <p className="text-xs font-medium text-muted-foreground mb-2">{label}:</p>
      <p className="text-sm text-foreground font-medium">{value || 'N/A'}</p>
    </div>
  );
};

// RelationCard Component
export const RelationCard = ({ item, variant }: { item: { word: string; ipa: string; meaning_en: string; meaning_vi: string }; variant: 'green' | 'red' }) => {
  const colors = {
    green: 'border-primary/30 hover:bg-primary/5',
    red: 'border-destructive/30 hover:bg-destructive/5'
  };

  return (
    <div className={cn('bg-card border rounded-lg p-3 transition-colors', colors[variant])}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground">{item.word}</span>
            <span className="text-xs text-muted-foreground">{item.ipa}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{item.meaning_en}</p>
          <p className="text-xs text-muted-foreground italic">{item.meaning_vi}</p>
        </div>
      </div>
    </div>
  );
};

// CollocationCard Component
export const CollocationCard = ({ collocation }: { collocation: { phrase: string; meaning: string; usage_example?: string; frequency_level: string } }) => {
  const levelColors = {
    common: 'bg-primary/10 text-primary',
    uncommon: 'bg-secondary/10 text-secondary-foreground',
    rare: 'bg-destructive/10 text-destructive-foreground'
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="font-semibold text-foreground">{collocation.phrase}</span>
        <span className={cn('text-xs px-2 py-1 rounded font-medium flex-shrink-0', levelColors[collocation.frequency_level as keyof typeof levelColors])}>
          {collocation.frequency_level}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{collocation.meaning}</p>
      {collocation.usage_example && (
        <p className="text-xs text-muted-foreground italic">"{collocation.usage_example}"</p>
      )}
    </div>
  );
};

// SentimentBadge Component
export const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const colors = {
    Positive: 'bg-primary/10 text-primary border-primary/20',
    Negative: 'bg-destructive/10 text-destructive border-destructive/20',
    Neutral: 'bg-muted/50 text-muted-foreground border-border',
    Mixed: 'bg-secondary/10 text-secondary-foreground border-secondary/20'
  };

  return (
    <span className={cn('px-3 py-1 rounded-full text-sm font-medium border', colors[sentiment as keyof typeof colors] || colors.Neutral)}>
      {sentiment}
    </span>
  );
};

// ScoreCard Component
export const ScoreCard = ({ label, score, color }: { label: string; score?: number; color: 'blue' | 'green' | 'purple' }) => {
  const colors = {
    blue: { bg: 'bg-primary', light: 'bg-primary/10', text: 'text-primary' },
    green: { bg: 'bg-secondary', light: 'bg-secondary/10', text: 'text-secondary-foreground' },
    purple: { bg: 'bg-accent', light: 'bg-accent/10', text: 'text-accent-foreground' }
  };

  const colorScheme = colors[color];
  const percentage = score || 0;

  return (
    <div className={cn('rounded-lg p-4 border border-border', colorScheme.light)}>
      <p className="text-sm font-medium text-foreground mb-3">{label}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', colorScheme.bg)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className={cn('text-lg font-bold', colorScheme.text)}>{percentage}</span>
      </div>
    </div>
  );
};