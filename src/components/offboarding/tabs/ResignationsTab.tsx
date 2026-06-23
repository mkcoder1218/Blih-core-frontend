import React from 'react';
import { useCreateExitInterview, useExitRequests, useSendOffboardingForm, useUpdateExitStatus } from '../../../hooks/useHrRecords';
import ExitAdminList from '../ExitAdminList';

interface Props {
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ResignationsTab({ showAlert }: Props) {
  const { data: requests = [], isLoading, isError, error, refetch } = useExitRequests();
  const updateStatus = useUpdateExitStatus();
  const createInterview = useCreateExitInterview();
  const sendOffboardingForm = useSendOffboardingForm();

  const handleUpdateStatus = async (id: string, status: string, data?: any) => {
    try {
      if (status === 'interview_scheduled') {
        await createInterview.mutateAsync({
          exitProcessId: id,
          data: {
            interviewDate: data?.interviewDate,
            startTime: data?.startTime,
            title: 'Exit Interview',
            interviewType: data?.interviewType || 'in-person',
            location: data?.location || null,
            meetingUrl: data?.meetingUrl || null,
          },
        });
      } else if (status === 'send_offboarding_form') {
        await sendOffboardingForm.mutateAsync(id);
      } else {
        await updateStatus.mutateAsync({ id, status, data });
      }
      showAlert(status === 'in_progress' ? 'Leave approved. Employee is now on leave.' : status === 'send_offboarding_form' ? 'Offboarding form sent and employee notified.' : status === 'completed' ? 'Final offboarding approved. Account hidden from active lists.' : status === 'rejected' ? 'Request rejected.' : 'Interview scheduled.', 'success');
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
      isUpdating={updateStatus.isPending || sendOffboardingForm.isPending}
      onRefresh={() => refetch()}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
