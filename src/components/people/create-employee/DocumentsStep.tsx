import { motion } from "motion/react";
import { FilePlus2 } from "lucide-react";
import { useEmployeeForm } from "./context";
import { UploadOrSelectRow, UploadRow } from "./UploadRows";

export default function DocumentsStep() {
  const { files, handleFileChange, offerLetterTemplates, selectedOfferTemplate, setSelectedOfferTemplate, setShowOfferLetterModal } = useEmployeeForm();
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <h3 className="mb-4 flex justify-between border-b border-slate-100 pb-3 text-sm font-bold text-slate-900"><span>Documents & Verifications</span><span className="text-[10px] font-medium text-slate-400">Any format under 5MB</span></h3>
      <div className="space-y-4">
        <div className="flex justify-end"><button type="button" onClick={() => setShowOfferLetterModal(true)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600"><FilePlus2 className="h-3 w-3" />Generate New Offer Letter</button></div>
        <UploadOrSelectRow label="Offer Letter" docKey="offerLetter" files={files} onFileChange={handleFileChange} templates={offerLetterTemplates} selectedTemplate={selectedOfferTemplate} onTemplateSelect={setSelectedOfferTemplate} onGenerateClick={() => setShowOfferLetterModal(true)} />
        <UploadRow label="Employment Contract" docKey="contract" files={files} onFileChange={handleFileChange} />
        <UploadRow label="Job Description" docKey="jobDescription" files={files} onFileChange={handleFileChange} />
        <UploadRow label="Fayda ID / National ID" docKey="nationalId" files={files} onFileChange={handleFileChange} />
        <UploadRow label="Passport / Clearance" docKey="passport" files={files} onFileChange={handleFileChange} />
      </div>
    </motion.div>
  );
}
