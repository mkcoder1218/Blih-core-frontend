import React from "react";
import { useOutletContext, useParams } from "react-router-dom";
import BusinessesView from "../components/businesses/BusinessesView";

export default function BusinessesPage() {
  const params = useParams();
  const tab = (params.tab as any) || "overview";
  const { showAlert } = useOutletContext<{ showAlert: (msg: string, type?: "success" | "info" | "error") => void }>();

  return <BusinessesView onDraftAiSuggestion={() => {}} showAlert={showAlert} currentTab={tab} />;
}
