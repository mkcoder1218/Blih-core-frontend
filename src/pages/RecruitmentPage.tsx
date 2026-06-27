import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import RecruitmentOverview from "../components/recruitment/RecruitmentOverview";
import RecruitmentRequests from "../components/recruitment/RecruitmentRequests";
import RecruitmentReadyToPost from "../components/recruitment/RecruitmentReadyToPost";
import RecruitmentClosedPosts from "../components/recruitment/RecruitmentClosedPosts";
import RecruitmentApplicantForms from "../components/recruitment/RecruitmentApplicantForms";
import RecruitmentOffers from "../components/recruitment/RecruitmentOffers";
import RecruitmentActivePosting from "../components/recruitment/RecruitmentActivePosting";
import RecruitmentOngoingRecruitment from "../components/recruitment/RecruitmentOngoingRecruitment";
import InterviewManagementView from "../components/recruitment/InterviewManagementView";
import CreateJobModal from "../components/recruitment/create-job/CreateJobModal";
import TemplateSelectionModal from "../components/recruitment/create-job/TemplateSelectionModal";
import { api } from "../api/client";
import { useJobRequests, useApproveJobRequest, usePublishJobRequest } from "../hooks/useJobRequests";
import { useMe } from "../hooks/useMe";
import { useQueryClient } from "@tanstack/react-query";
import OfferLetterTemplatePage from "./OfferLetterTemplatePage";

export default function RecruitmentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const tab = (params.tab as any) || "overview";
  const queryClient = useQueryClient();

  const pendingJobRequests = useJobRequests({ status: "pending" });
  const declinedJobRequests = useJobRequests({ status: "declined" });
  const approvedByMeJobRequests = useJobRequests({ approvedByMe: true });
  const approvedByOthersJobRequests = useJobRequests({ status: "pending", approvedByOthers: true });
  const approvedJobRequests = useJobRequests({ status: "approved" });
  
  const approveJob = useApproveJobRequest();
  const publishJob = usePublishJobRequest();
  
  const { data: meRes } = useMe();
  const me = meRes?.data;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplateSelectionOpen, setIsTemplateSelectionOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"job" | "template">("job");
  const [initialFormData, setInitialFormData] = useState<any>(null);

  const openCreateModal = async (mode: "job" | "template") => {
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
        return <RecruitmentOverview onNavigateToTab={(newTab) => navigate(`/recruitment/${newTab}`)} />;
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
            onJustifyJob={() => {}} 
            onOpenNewJobModal={() => openCreateModal("job")} 
            onSuggestJustification={() => {}} 
            currentUser={me ? { id: me.user.id, role: (me.roles?.[0] || 'GUEST'), name: me.user.fullName } : undefined}
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
                            navigate('/recruitment/active_posting');
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
        return <RecruitmentOffers showAlert={() => {}} />;
      case "offer_templates":
        return <OfferLetterTemplatePage />;
      case "active_posting":
        return <RecruitmentActivePosting onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
      case "ongoing_recruitment":
        return <RecruitmentOngoingRecruitment onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
      case "my_interviews":
        return <InterviewManagementView showAlert={() => {}} />;
      default:
        return <RecruitmentOverview onNavigateToTab={(newTab) => navigate(`/recruitment/${newTab}`)} />;
    }
  };

  return (
    <div className="space-y-6">
      {tab === "requests" && (
        <div className="flex justify-end">
          <button
            onClick={() => openCreateModal("job")}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs px-5 py-2.5 flex items-center gap-2 shadow-md shadow-blue-200 transition-all cursor-pointer select-none"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Request a Job</span>
          </button>
        </div>
      )}

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Create Job Modal */}
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
            console.log(`${modalMode} created successfully`);
            await queryClient.invalidateQueries({ queryKey: ["job-requests"] });
          } catch (err) {
            console.error("Failed to save:", err);
          }
          setIsCreateModalOpen(false);
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
