import React from "react";
import { useParams } from "react-router-dom";
import RecruitmentOverview from "../components/recruitment/RecruitmentOverview";
import RecruitmentRequests from "../components/recruitment/RecruitmentRequests";
import RecruitmentReadyToPost from "../components/recruitment/RecruitmentReadyToPost";
import RecruitmentClosedPosts from "../components/recruitment/RecruitmentClosedPosts";
import RecruitmentApplicantForms from "../components/recruitment/RecruitmentApplicantForms";
import RecruitmentOffers from "../components/recruitment/RecruitmentOffers";
import RecruitmentActivePosting from "../components/recruitment/RecruitmentActivePosting";
import RecruitmentOngoingRecruitment from "../components/recruitment/RecruitmentOngoingRecruitment";
import { mockJobRequests, activeReadyToPostJob } from "../mockData";

export default function RecruitmentPage() {
  const params = useParams();
  const tab = (params.tab as any) || "overview";

  if (tab === "overview") return <RecruitmentOverview onNavigateToTab={() => {}} />;
  if (tab === "requests") return <RecruitmentRequests jobs={mockJobRequests} onApproveJob={() => {}} onJustifyJob={() => {}} onOpenNewJobModal={() => {}} onSuggestJustification={() => {}} />;
  if (tab === "ready_to_post") return <RecruitmentReadyToPost onPostSuccess={() => {}} onEditClick={() => {}} />;
  if (tab === "closed_posts") return <RecruitmentClosedPosts onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (tab === "applicant_forms") return <RecruitmentApplicantForms onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (tab === "offers") return <RecruitmentOffers onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (tab === "active_posting") return <RecruitmentActivePosting onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (tab === "ongoing_recruitment") return <RecruitmentOngoingRecruitment onDraftAiSuggestion={() => {}} showAlert={() => {}} />;

  return <RecruitmentOverview onNavigateToTab={() => {}} />;
}
