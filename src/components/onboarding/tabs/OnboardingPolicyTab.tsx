/**
 * OnboardingPolicyTab — Employee Policy review & acceptance tab.
 *
 * Lists all active company policies, lets employees read and accept each one,
 * and shows an overall compliance summary.
 */
import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  PageHeader,
  SectionCard,
  StatCard,
  StatCardGrid,
  EmptyState,
  LoadingSpinner,
  StatusBadge,
  InfoAlert,
  ConfirmDialog,
} from '@/components/ui/blih';
import { useActivePolicies } from '../../../hooks/usePolicies';
import { usePolicyMutations } from '../../../hooks/usePolicies';
import { POLICY_TYPE_LABELS, type PolicyType } from '../../../api/policies';
import type { ActivePolicy } from '../../../api/policies';

interface OnboardingPolicyTabProps {
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OnboardingPolicyTab({ showAlert }: OnboardingPolicyTabProps) {
  const { data: policies, isLoading, error } = useActivePolicies();
  const { acceptPolicy } = usePolicyMutations();

  // Which policy card is expanded to show full content
  const [expanded, setExpanded] = useState<string | null>(null);
  // Confirmation dialog state
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const handleAcceptConfirm = () => {
    if (!confirmId) return;
    acceptPolicy.mutate(confirmId, {
      onSuccess: () => {
        showAlert('Policy accepted successfully.', 'success');
        setConfirmId(null);
        setExpanded(null);
      },
      onError: () => {
        showAlert('Failed to accept policy. Please try again.', 'error');
        setConfirmId(null);
      },
    });
  };

  // Derived stats
  const total    = policies?.length ?? 0;
  const accepted = policies?.filter(p => p.isAccepted).length ?? 0;
  const pending  = total - accepted;
  const allDone  = total > 0 && pending === 0;

  const confirmPolicy = confirmId ? policies?.find(p => p._id === confirmId) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        eyebrow="Onboarding"
        title="Employee Policies"
        description="Review and accept all company policies to complete your onboarding."
      />

      {/* Summary Stats */}
      <StatCardGrid cols={3}>
        <StatCard
          label="Total Policies"
          value={total}
          icon={<FileText />}
          tone="blue"
        />
        <StatCard
          label="Accepted"
          value={accepted}
          icon={<CheckCircle2 />}
          tone="emerald"
        />
        <StatCard
          label="Pending Acceptance"
          value={pending}
          icon={<Clock />}
          tone={pending > 0 ? 'amber' : 'slate'}
        />
      </StatCardGrid>

      {/* All-done banner */}
      {allDone && (
        <InfoAlert
          variant="success"
          message="All company policies have been accepted. You're fully onboarded!"
        />
      )}

      {/* Error state */}
      {error && (
        <InfoAlert
          variant="error"
          message="Failed to load policies. Please refresh the page or contact HR."
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner label="Loading policies…" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && total === 0 && (
        <EmptyState
          icon={<ShieldCheck />}
          title="No active policies"
          description="Your HR team hasn't published any policies yet. Check back later."
        />
      )}

      {/* Policy cards */}
      {!isLoading && !error && policies && policies.length > 0 && (
        <div className="space-y-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy._id}
              policy={policy}
              isExpanded={expanded === policy._id}
              onToggle={() => toggleExpand(policy._id)}
              onAccept={() => setConfirmId(policy._id)}
              acceptPending={acceptPolicy.isPending && confirmId === policy._id}
            />
          ))}
        </div>
      )}

      {/* Confirm accept dialog */}
      <ConfirmDialog
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        onConfirm={handleAcceptConfirm}
        title={`Accept "${confirmPolicy?.title ?? 'Policy'}"`}
        description={`You are confirming that you have read and agree to the ${confirmPolicy?.title ?? 'policy'} (v${confirmPolicy?.version ?? 1}). This action cannot be undone.`}
        confirmLabel="I Accept"
        variant="default"
        loading={acceptPolicy.isPending}
      />
    </div>
  );
}

// ── PolicyCard ─────────────────────────────────────────────────────────────────

interface PolicyCardProps {
  policy: ActivePolicy;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  acceptPending: boolean;
}

function PolicyCard({ policy, isExpanded, onToggle, onAccept, acceptPending }: PolicyCardProps) {
  const typeLabel = POLICY_TYPE_LABELS[policy.policyType as PolicyType] ?? policy.policyType;

  return (
    <SectionCard
      title={policy.title}
      icon={<FileText />}
      accent={policy.isAccepted ? 'emerald' : 'blue'}
      action={
        <div className="flex items-center gap-2">
          {policy.isRequired && (
            <span className="text-[9.5px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
              Required
            </span>
          )}
          <StatusBadge
            status={policy.isAccepted ? 'completed' : 'pending'}
          />
        </div>
      }
    >
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wide">
          {typeLabel}
        </span>
        <span className="text-[10px] text-slate-400 font-semibold">
          Version {policy.version}
        </span>
        {policy.publishedAt && (
          <span className="text-[10px] text-slate-400 font-semibold">
            Published {new Date(policy.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {policy.isAccepted && policy.acceptedAt && (
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
            Accepted on {new Date(policy.acceptedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Expand / collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors mb-3"
      >
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {isExpanded ? 'Collapse policy' : 'Read policy'}
      </button>

      {/* Policy content */}
      {isExpanded && (
        <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-80 overflow-y-auto">
          {policy.contentHtml ? (
            <div
              className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed
                         prose-headings:font-black prose-headings:text-slate-900
                         prose-p:my-2 prose-li:my-0.5"
              dangerouslySetInnerHTML={{ __html: policy.contentHtml }}
            />
          ) : (
            <p className="text-xs text-slate-500 font-medium">{policy.contentText || 'No content available.'}</p>
          )}
        </div>
      )}

      {/* Accept button */}
      {!policy.isAccepted && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold max-w-sm">
            {policy.isRequired
              ? 'This policy must be accepted to continue onboarding.'
              : 'Accepting this policy is recommended but optional.'}
          </p>
          <button
            onClick={onAccept}
            disabled={acceptPending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs px-5 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            {acceptPending ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Accepting…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                I Accept
              </>
            )}
          </button>
        </div>
      )}

      {/* Already accepted confirmation */}
      {policy.isAccepted && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <p className="text-[11px] text-emerald-600 font-bold">
            You have accepted this policy.
          </p>
        </div>
      )}
    </SectionCard>
  );
}
