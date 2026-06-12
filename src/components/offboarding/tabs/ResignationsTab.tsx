import React from 'react';
import { useCreateExitInterview, useExitRequests, useUpdateExitStatus } from '../../../hooks/useHrRecords';
import ExitAdminList from '../ExitAdminList';

interface Props {
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ResignationsTab({ showAlert }: Props) {
  const { data: requests = [], isLoading, isError, error, refetch } = useExitRequests();
  const updateStatus = useUpdateExitStatus();
  const createInterview = useCreateExitInterview();

  const handleUpdateStatus = async (id: string, status: string, data?: any) => {
    try {
      if (status === 'interview_scheduled') {
        await createInterview.mutateAsync({ exitProcessId: id, data: { interviewDate: data?.interviewDate, title: 'Exit Interview', interviewType: 'in-person' } });
      } else {
        await updateStatus.mutateAsync({ id, status, data });
      }
      showAlert(status === 'in_progress' ? 'Resignation approved successfully!' : status === 'rejected' ? 'Request rejected.' : 'Interview scheduled.', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  return (
    <ExitAdminList
      requests={requests}
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as any)?.response?.data?.error || (error as any)?.message}
      isUpdating={updateStatus.isPending}
      onRefresh={() => refetch()}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
