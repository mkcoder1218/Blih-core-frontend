import React, { useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import RecruitmentOverview from "../components/recruitment/RecruitmentOverview";
import RecruitmentRequests from "../components/recruitment/RecruitmentRequests";
import RecruitmentReadyToPost from "../components/recruitment/RecruitmentReadyToPost";
import RecruitmentClosedPosts from "../components/recruitment/RecruitmentClosedPosts";
import RecruitmentApplicantForms from "../components/recruitment/RecruitmentApplicantForms";
import JobRecruitmentWorkspace from "../components/recruitment/JobRecruitmentWorkspace";
import RecruitmentActivePosting from "../components/recruitment/RecruitmentActivePosting";
import RecruitmentOngoingRecruitment from "../components/recruitment/RecruitmentOngoingRecruitment";
import InterviewManagementView from "../components/recruitment/InterviewManagementView";
import CreateJobModal from "../components/recruitment/create-job/CreateJobModal";
import TemplateSelectionModal from "../components/recruitment/create-job/TemplateSelectionModal";
import { api } from "../api/client";
import { useJobRequests, useApproveJobRequest, usePublishJobRequest, useDeclineJobRequest } from "../hooks/useJobRequests";
import { useMe } from "../hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";
import OfferLetterTemplatePage from "./OfferLetterTemplatePage";

interface RecruitmentPageProps {
  currentTab?: string;
  routeForTab?: (tab: string) => string;
}

export default function RecruitmentPage({ currentTab, routeForTab }: RecruitmentPageProps = {}) {
  const params = useParams();
  const navigate = useNavigate();
  const tab = (currentTab || params.tab || "overview") as any;
  const queryClient = useQueryClient();
  const getRouteForTab = routeForTab || ((newTab: string) => `/recruitment/${newTab}`);

  const pendingJobRequests = useJobRequests({ status: "pending" });
  const declinedJobRequests = useJobRequests({ status: "declined" });
  const approvedByMeJobRequests = useJobRequests({ approvedByMe: true });
  const approvedByOthersJobRequests = useJobRequests({ status: "pending", approvedByOthers: true });
  const approvedJobRequests = useJobRequests({ status: "approved" });
  
  const approveJob = useApproveJobRequest();
  const declineJob = useDeclineJobRequest();
  const publishJob = usePublishJobRequest();
  
  const { data: meRes } = useMe();
  const me = meRes?.data;
  const { showAlert } = useOutletContext<{
    showAlert?: (message: string, type?: "success" | "info" | "error") => void;
  }>();
  const isDepartmentHead = (me?.roles || []).some((role: string) =>
    ["DEPARTMENT_HEAD", "DEPT_HEAD"].includes(role.toUpperCase()),
  );
  const canRequestJob =
    isDepartmentHead || (me?.permissions || []).includes("job.request");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"job" | "template">("job");
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const openCreateModal = async (mode: "job" | "template") => {
    if (mode === "job" && !canRequestJob) {
      showAlert?.("You do not have permission to request a new job opening.", "error");
      return;
    }

    if (mode === "job") {
      try {
        const res = await api.get("/api/v1/hr/recruitment/templates", { params: { limit: 1 } });
        const payload: any = res.data;
        const rows = payload?.data?.data ?? payload?.data ?? [];
        
        if (Array.isArray(rows) && rows.length > 0) {
          setIsTemplateSelectionOpen(true);
        } else {
          setModalMode("job");
          setInitialFormData(null);
          setIsCreateModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to check templates:', err);
        setModalMode("job");
        setInitialFormData(null);
        setIsCreateModalOpen(true);
      }
    } else {
      setModalMode("template");
      setInitialFormData(null);
      setIsCreateModalOpen(true);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setModalMode("job");
    setInitialFormData({
      ...template.requestConfig,
      ...template.jobDetailsConfig,
      ...template.applicationFormConfig
    });
    setIsTemplateSelectionOpen(false);
    setIsCreateModalOpen(true);
  };

  const handleSkipTemplate = () => {
    setModalMode("job");
    setInitialFormData(null);
    setIsTemplateSelectionOpen(false);
    setIsCreateModalOpen(true);
  };

  const renderTabContent = () => {
    switch (tab) {
      case "overview":
        return <RecruitmentOverview onNavigateToTab={(newTab) => navigate(getRouteForTab(newTab))} />;
      case "requests":
        return (
          <RecruitmentRequests 
            jobs={[
              ...(pendingJobRequests.data?.rows || []),
              ...(approvedByMeJobRequests.data?.rows || []),
              ...(approvedByOthersJobRequests.data?.rows || []),
              ...(declinedJobRequests.data?.rows || []),
            ]} 
            onApproveJob={(id) => approveJob.mutate(id)} 
            onRejectJob={(id, reason) => declineJob.mutate({ id, reason })}
            onJustifyJob={() => {}} 
            onOpenNewJobModal={() => openCreateModal("job")} 
            onSuggestJustification={() => {}} 
            currentUser={me ? { id: me.user.id, role: (me.roles?.[0] || 'GUEST'), roles: me.roles || [], permissions: me.permissions || [], name: me.user.fullName } : undefined}
          />
        );
      case "ready_to_post":
        return (
          <RecruitmentReadyToPost 
            jobs={approvedJobRequests.data?.rows || []}
            onPostSuccess={(jobTitle, id) => {
                if (id) {
                    publishJob.mutate(id, {
                        onSuccess: () => {
                            console.log(`Job published: ${jobTitle}`);
                            navigate(getRouteForTab('active_posting'));
                        }
                    });
                }
            }} 
            onEditClick={() => {}} 
          />
        );
      case "closed_posts":
        return <RecruitmentClosedPosts onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
      case "applicant_forms":
        return (
          <RecruitmentApplicantForms 
            onDraftAiSuggestion={() => {}} 
            showAlert={() => {}} 
            onOpenCreateTemplateModal={() => openCreateModal("template")} 
          />
        );
      case "offers":
        return <JobRecruitmentWorkspace initialTab="offers" showAlert={() => {}} />;
      case "offer_templates":
        return <OfferLetterTemplatePage />;
      case "active_posting":
        return <RecruitmentActivePosting onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
      case "ongoing_recruitment":
        return <RecruitmentOngoingRecruitment onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
      case "my_interviews":
        return <InterviewManagementView showAlert={() => {}} />;
      default:
        return <RecruitmentOverview onNavigateToTab={(newTab) => navigate(getRouteForTab(newTab))} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        {renderTabContent()}
      </div>

      <CreateJobModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        isTemplateMode={modalMode === "template"}
        initialData={initialFormData}
        onCreate={async (data) => {
          try {
            const endpoint = modalMode === "template" 
              ? "/api/v1/hr/recruitment/templates" 
              : "/api/v1/hr/recruitment/job-openings";
            
            const payload = modalMode === "template" ? {
              name: data.jobTitle || "Untitled Template",
              description: data.businessJustification,
              requestConfig: {
                jobTitle: data.jobTitle,
                department: data.department,
                position: data.position,
                type: data.type,
                replaceFor: data.replaceFor,
                employmentType: data.employmentType,
                workMode: data.workMode,
                urgency: data.urgency,
                priority: data.priority,
                neededByDate: data.neededByDate
              },
              jobDetailsConfig: {
                openings: data.openings,
                city: data.city,
                country: data.country,
                locationType: data.locationType,
                contractType: data.contractType,
                experienceLevel: data.experienceLevel,
                hiringManager: data.hiringManager,
                deadline: data.deadline,
                description: data.description,
                summary: data.summary,
                responsibilities: data.responsibilities,
                requiredSkills: data.requiredSkills,
                preferredSkills: data.preferredSkills,
                tools: data.tools,
                benefits: data.benefits,
                salaryType: data.salaryType
              },
              applicationFormConfig: {
                applicantFields: data.applicantFields,
                customFields: data.customFields
              }
            } : {
                title: data.jobTitle,
                employmentType: data.employmentType,
                headcount: data.openings,
                description: data.description,
                priority: (data.priority || "Medium").toString().toLowerCase(),
                metadata: {
                    department: data.department,
                    position: data.position,
                    priority: data.priority,
                    neededByDate: data.neededByDate,
                    urgency: data.urgency,
                    hiringManager: data.hiringManager,
                    applicationFields: data.applicantFields,
                    customFields: data.customFields,
                    requirements: data.requiredSkills || [],
                    qualifications: data.preferredSkills || [],
                    importance: data.businessJustification || "Standard business requirement."
                }
            };

            await api.post(endpoint, payload);
            await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
            await queryClient.invalidateQueries({ queryKey: ["recruitment-templates"] });
            showAlert?.(
              modalMode === "template"
                ? "Job template saved successfully."
                : "Hiring request submitted for HR review.",
              "success",
            );
            setIsCreateModalOpen(false);
            setInitialFormData(null);
          } catch (err: any) {
            console.error("Failed to save:", err);
            showAlert?.(
              err?.response?.data?.message ||
                (modalMode === "template" ? "Failed to save job template." : "Failed to submit hiring request."),
              "error",
            );
            throw err;
          }
        }} 
      />

      <TemplateSelectionModal 
        isOpen={isTemplateSelectionOpen}
        onClose={() => setIsTemplateSelectionOpen(false)}
        onSelect={handleTemplateSelect}
        onSkip={handleSkipTemplate}
      />
    </div>
  );
}
