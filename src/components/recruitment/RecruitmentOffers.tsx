import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, CheckCircle2, Briefcase, Plus, Send, Eye,
  Loader2, UserPlus, X, RefreshCw, Pencil,
} from "lucide-react";
import {
  getOfferLetters,
} from "../../api/offerLetters";
import OfferLetterCreateModal from "../offer-letters/OfferLetterCreateModal";
import OfferLetterPreviewModal from "../offer-letters/OfferLetterPreviewModal";
import CreateEmployeeModal from "../people/CreateEmployeeModal";
import OnboardingInitializerModal from "../onboarding/OnboardingInitializerModal";
import {
  StatCard, StatCardGrid, TabSwitcher, StatusBadge, LoadingSpinner, EmptyState,
} from "@/components/ui/blih";

// ─── Types ────────────────────────────────────────────────────────────────────
type OfferStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
type TabKey = "Offers" | "Accepted" | "Rejected";

interface OfferLetter {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  salary: string;
  startDate: string;
  employmentType: string;
  status: OfferStatus;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  renderedHtml?: string;
  renderedSubject?: string;
  Department?: { name: string };
  Position?: { title: string };
  Role?: { name: string };
  OfferLetterTemplate?: { name: string };
  departmentId: string;
  positionId: string;
  roleId: string;
  templateId: string;
  workLocation?: string;
  reportingManager?: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }: { msg: string; type: "success" | "error" | "info"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  const bg = type === "success" ? "bg-emerald-600" : type === "error" ? "bg-rose-600" : "bg-blue-600";
  return (
    <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-[13px] font-bold ${bg}`}>
      {msg}
      <button onClick={onDone} className="ml-1 opacity-70 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onDraftAiSuggestion?: (ctx: string) => void;
  showAlert?: (msg: string, type?: "success" | "error" | "info") => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RecruitmentOffers({ showAlert: externalAlert }: Props) {
  // ── Data ──
  const [offers, setOffers]     = useState<OfferLetter[]>([]);
  const [loading, setLoading]   = useState(true);

  // ── UI state ──
  const [activeTab, setActiveTab]           = useState<TabKey>("Offers");
  const [toast, setToast]                   = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  // ── Modals ──
  const [addCandidateOpen, setAddCandidateOpen]   = useState(false);
  const [createOfferOpen, setCreateOfferOpen]     = useState(false);
  const [previewOpen, setPreviewOpen]             = useState(false);
  const [selectedOffer, setSelectedOffer]         = useState<OfferLetter | null>(null);
  const [onboardingOffer, setOnboardingOffer]     = useState<OfferLetter | null>(null);

  // ── Alert helper ──
  const showAlert = useCallback((msg: string, type: "success" | "error" | "info" = "success") => {
    setToast({ msg, type });
    externalAlert?.(msg, type);
  }, [externalAlert]);

  // ── Fetch ──
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOfferLetters({ limit: 100 });
      const raw = res.data?.data;
      const rows: OfferLetter[] = Array.isArray(raw) ? raw : (raw?.rows ?? []);
      setOffers(rows);
    } catch {
      showAlert("Failed to load offer letters", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // ── Counts ──
  const pendingCount  = offers.filter(o => o.status === "DRAFT" || o.status === "SENT").length;
  const acceptedCount = offers.filter(o => o.status === "ACCEPTED").length;
  const rejectedCount = offers.filter(o => o.status === "REJECTED").length;

  // ── Filtered rows ──
  const filtered = offers.filter(o => {
    if (activeTab === "Offers")   return o.status === "DRAFT" || o.status === "SENT";
    if (activeTab === "Accepted") return o.status === "ACCEPTED";
    if (activeTab === "Rejected") return o.status === "REJECTED";
    return true;
  });

  const handleViewOffer = (offer: OfferLetter) => {
    setSelectedOffer(offer);
    setPreviewOpen(true);
  };

  const handleSignOffer = (offer: OfferLetter) => {
    setSelectedOffer(offer);
    setCreateOfferOpen(true);
  };

  const handleEditOffer = (offer: OfferLetter) => {
    setSelectedOffer(offer);
    setCreateOfferOpen(true);
  };

  return (
    <div className="space-y-5 font-sans pb-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Stats row ── */}
      <StatCardGrid cols={3}>
        <StatCard label="Pending Offers"  value={pendingCount}  icon={<Clock className="w-5 h-5" />}        tone="amber" />
        <StatCard label="Accepted Offers" value={acceptedCount} icon={<CheckCircle2 className="w-5 h-5" />} tone="blue" />
        <StatCard label="Rejected Offers" value={rejectedCount} icon={<Briefcase className="w-5 h-5" />}    tone="rose" />
      </StatCardGrid>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Offer Management</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Manage candidate offers, salary approvals, contract status, and onboarding progress</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOffers} disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setAddCandidateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all">
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Candidate
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <TabSwitcher
        tabs={[
          { id: "Offers",   label: "Offers",   badge: pendingCount  },
          { id: "Accepted", label: "Accepted", badge: acceptedCount },
          { id: "Rejected", label: "Rejected", badge: rejectedCount },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as TabKey)}
      />

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
          <div className={`w-2.5 h-2.5 rounded-full ${
            activeTab === "Offers" ? "bg-amber-400" : activeTab === "Accepted" ? "bg-emerald-500" : "bg-rose-500"
          }`} />
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            {activeTab === "Offers" ? "Pending Offers" : activeTab === "Accepted" ? "Accepted Offers" : "Rejected Offers"}
          </h4>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading offers…" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-blue-600 font-extrabold uppercase tracking-wide text-[10px]">
                  <th className="py-3 px-5 font-black">Candidate Name</th>
                  <th className="py-3 px-5 font-black">Job Position</th>
                  <th className="py-3 px-5 font-black">Salary</th>
                  <th className="py-3 px-5 font-black">Offer Status</th>
                  <th className="py-3 px-5 font-black">Onboarding</th>
                  <th className="py-3 px-5 font-black">Start Date</th>
                  <th className="py-3 px-5 text-right font-black">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(offer => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    onSign={handleSignOffer}
                    onView={handleViewOffer}
                    onEdit={handleEditOffer}
                    onOnboarding={() => setOnboardingOffer(offer)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        title={`No ${activeTab.toLowerCase()} offers found.`}
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Candidate modal ── */}
      <CreateEmployeeModal
        isOpen={addCandidateOpen}
        onClose={() => setAddCandidateOpen(false)}
        showAlert={showAlert}
        onSuccess={() => {
          setAddCandidateOpen(false);
          fetchOffers();
          showAlert("Candidate profile created successfully", "success");
        }}
      />

      {/* ── Create / Send offer letter modal ── */}
      {createOfferOpen && (
        <OfferLetterCreateModal
          isOpen={createOfferOpen}
          onClose={() => { setCreateOfferOpen(false); setSelectedOffer(null); }}
          showAlert={showAlert}
          initialData={selectedOffer ? {
            candidateName:  selectedOffer.candidateName,
            candidateEmail: selectedOffer.candidateEmail,
            candidatePhone: selectedOffer.candidatePhone,
            departmentId:   selectedOffer.departmentId,
            positionId:     selectedOffer.positionId,
            roleId:         selectedOffer.roleId,
            salary:         selectedOffer.salary,
            startDate:      selectedOffer.startDate?.slice(0, 10),
            employmentType: selectedOffer.employmentType,
            workLocation:   selectedOffer.workLocation,
            reportingManager: selectedOffer.reportingManager,
          } : undefined}
          onSuccess={() => {
            setCreateOfferOpen(false);
            setSelectedOffer(null);
            fetchOffers();
            showAlert("Offer letter sent successfully", "success");
          }}
        />
      )}

      {/* ── Preview existing sent/accepted offer ── */}
      {previewOpen && selectedOffer?.renderedHtml && (
        <OfferLetterPreviewModal
          isOpen={previewOpen}
          onClose={() => { setPreviewOpen(false); setSelectedOffer(null); }}
          previewData={{
            html: selectedOffer.renderedHtml,
            subject: selectedOffer.renderedSubject || "",
            missingVariables: [],
            payloadData: {},
          }}
          formData={{
            templateId:     selectedOffer.templateId,
            candidateName:  selectedOffer.candidateName,
            candidateEmail: selectedOffer.candidateEmail,
          }}
          showAlert={showAlert}
          onSuccess={() => {
            setPreviewOpen(false);
            setSelectedOffer(null);
            fetchOffers();
          }}
        />
      )}

      {/* ── Onboarding Initializer modal ── */}
      {onboardingOffer && (
        <OnboardingInitializerModal
          isOpen={Boolean(onboardingOffer)}
          onClose={() => setOnboardingOffer(null)}
          offer={onboardingOffer}
          showAlert={showAlert}
          onSuccess={() => {
            setOnboardingOffer(null);
            fetchOffers();
          }}
        />
      )}
    </div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────
function OfferRow({ offer, onSign, onView, onEdit, onOnboarding }: {
  offer: OfferLetter;
  onSign: (o: OfferLetter) => void;
  onView: (o: OfferLetter) => void;
  onEdit: (o: OfferLetter) => void;
  onOnboarding: () => void;
}) {
  const position   = offer.Position?.title || offer.Role?.name || "—";
  const department = offer.Department?.name || "—";
  const startDate  = offer.startDate
    ? new Date(offer.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      {/* Candidate */}
      <td className="py-3.5 px-5">
        <div className="font-bold text-slate-900 text-[12.5px]">{offer.candidateName}</div>
        <div className="text-[10px] text-slate-400 font-bold mt-0.5">{offer.candidateEmail}</div>
      </td>

      {/* Position */}
      <td className="py-3.5 px-5">
        <div className="font-bold text-slate-800">{position}</div>
        <div className="text-[9.5px] text-blue-600 font-extrabold tracking-wide uppercase mt-0.5">{department}</div>
      </td>

      {/* Salary */}
      <td className="py-3.5 px-5 font-bold text-slate-800">{offer.salary || "—"}</td>

      {/* Status badge */}
      <td className="py-3.5 px-5">
        <StatusBadge
          label={offer.status === "DRAFT" ? "Pending" : offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
          tone={offer.status === "DRAFT" ? "amber" : offer.status === "SENT" ? "blue" : offer.status === "ACCEPTED" ? "emerald" : "rose"}
        />
      </td>

      {/* Onboarding */}
      <td className="py-3.5 px-5 text-slate-400 text-[12px] font-medium">
        {offer.status === "ACCEPTED" ? (
          <span className="text-emerald-600 font-bold text-[10px] uppercase tracking-wide">Ready</span>
        ) : "—"}
      </td>

      {/* Start date */}
      <td className="py-3.5 px-5 text-slate-500 font-medium text-[12px]">{startDate}</td>

      {/* Action */}
      <td className="py-3.5 px-5 text-right">
        <RowAction offer={offer} onSign={onSign} onView={onView} onEdit={onEdit} onOnboarding={onOnboarding} />
      </td>
    </tr>
  );
}

// ─── Row action button ────────────────────────────────────────────────────────
function RowAction({ offer, onSign, onView, onEdit, onOnboarding }: {
  offer: OfferLetter;
  onSign: (o: OfferLetter) => void;
  onView: (o: OfferLetter) => void;
  onEdit: (o: OfferLetter) => void;
  onOnboarding: () => void;
}) {
  if (offer.status === "DRAFT") {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => onEdit(offer)}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button onClick={() => onSign(offer)}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[10px] font-black text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
          <Send className="w-3 h-3" /> Send
        </button>
      </div>
    );
  }
  if (offer.status === "SENT") {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button onClick={() => onEdit(offer)}
          className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors">
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button onClick={() => onView(offer)}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[10px] font-black text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors">
          <Eye className="w-3 h-3" /> Preview
        </button>
      </div>
    );
  }
  if (offer.status === "ACCEPTED") {
    return (
      <button onClick={onOnboarding}
        className="flex items-center gap-1.5 ml-auto bg-emerald-50 hover:bg-emerald-100 text-[10px] font-black text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors">
        <UserPlus className="w-3 h-3" /> + Onboarding
      </button>
    );
  }
  return <span className="text-slate-300 text-xs">—</span>;
}
