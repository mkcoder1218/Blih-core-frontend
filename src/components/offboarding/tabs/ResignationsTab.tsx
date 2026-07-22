import {
  useCreateExitInterview,
  useExitRequests,
  useSendOffboardingForm,
  useUpdateExitStatus,
} from '../../../hooks/useHrRecords';

import ExitAdminList from '../ExitAdminList';

interface Props {
  showAlert: (
    message: string,
    type?: 'success' | 'error' | 'info',
  ) => void;
}

export default function ResignationsTab({
  showAlert,
}: Props) {
  const {
    data: requests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useExitRequests();

  const updateStatus =
    useUpdateExitStatus();

  const createInterview =
    useCreateExitInterview();

  const sendOffboardingForm =
    useSendOffboardingForm();

  const handleUpdateStatus = async (
    id: string,
    status: string,
    data?: Record<
      string,
      unknown
    >,
  ) => {
    try {
      if (
        status ===
        'interview_scheduled'
      ) {
        await createInterview.mutateAsync({
          exitProcessId: id,

          data: {
            interviewDate:
              data?.interviewDate as
                | string
                | undefined,

            startTime:
              data?.startTime as
                | string
                | undefined,

            title: 'Exit Interview',

            interviewType:
              (data?.interviewType as
                | string
                | undefined) ||
              'in-person',

            location:
              (data?.location as
                | string
                | null
                | undefined) ??
              null,

            meetingUrl:
              (data?.meetingUrl as
                | string
                | null
                | undefined) ??
              null,
          },
        });
      } else if (
        status ===
        'send_offboarding_form'
      ) {
        await sendOffboardingForm.mutateAsync(
          id,
        );
      } else {
        await updateStatus.mutateAsync({
          id,
          status,
          data,
        });
      }

      const successMessage =
        status === 'in_progress'
          ? 'Leave approved. Employee is now on leave.'
          : status ===
              'send_offboarding_form'
            ? 'Offboarding form sent and employee notified.'
            : status === 'completed'
              ? 'Final offboarding approved. Account hidden from active lists.'
              : status === 'rejected'
                ? 'Request rejected.'
                : status ===
                    'interview_scheduled'
                  ? 'Interview scheduled.'
                  : 'Status updated successfully.';

      showAlert(
        successMessage,
        'success',
      );
    } catch (error: any) {
      showAlert(
        error?.response?.data?.error ||
          error?.response?.data
            ?.message ||
          error?.message ||
          'Failed to update status',
        'error',
      );
    }
  };

  return (
    <ExitAdminList
      requests={requests}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        (error as any)?.response?.data
          ?.error ||
        (error as any)?.response?.data
          ?.message ||
        (error as any)?.message
      }
      isUpdating={
        updateStatus.isPending ||
        createInterview.isPending ||
        sendOffboardingForm.isPending
      }
      onRefresh={() => {
        void refetch();
      }}
      onUpdateStatus={
        handleUpdateStatus
      }
    />
  );
}
