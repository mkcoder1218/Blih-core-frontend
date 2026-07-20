import {
  CheckSquare,
  Clock,
  Home,
} from 'lucide-react';

import {
  StatCard,
  StatCardGrid,
} from '@/components/ui/blih';

interface WfhStatsProps {
  myTotal: number;
  pendingTotal: number;
  totalRequests: number;
  isLoading?: boolean;
}

export default function WfhStats({
  myTotal,
  pendingTotal,
  totalRequests,
  isLoading = false,
}: WfhStatsProps) {
  const displayValue = (value: number) =>
    isLoading ? '-' : value;

  return (
    <StatCardGrid cols={3}>
      <StatCard
        label="My WFH Requests"
        value={displayValue(myTotal)}
        icon={<Home className="h-5 w-5" />}
        tone="blue"
      />

      <StatCard
        label="Pending Approval"
        value={displayValue(pendingTotal)}
        icon={<Clock className="h-5 w-5" />}
        tone="amber"
      />

      <StatCard
        label="Total WFH Requests"
        value={displayValue(totalRequests)}
        icon={<CheckSquare className="h-5 w-5" />}
        tone="emerald"
      />
    </StatCardGrid>
  );
}