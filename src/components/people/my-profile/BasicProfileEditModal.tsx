import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Camera, Phone, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { BasicProfileForm, EditTab } from "./types";
import { initials } from "./utils";

interface BasicProfileEditModalProps {
  open: boolean;
  initialValue: BasicProfileForm;
  currentImageUrl?: string | null;
  onClose: () => void;
  onSave: (value: BasicProfileForm, image: File | null) => Promise<void>;
}

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function BasicProfileEditModal({
  open,
  initialValue,
  currentImageUrl,
  onClose,
  onSave,
}: BasicProfileEditModalProps) {
  const [activeTab, setActiveTab] = useState<EditTab>("personal");
  const [form, setForm] = useState<BasicProfileForm>(initialValue);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initialValue);
    setImage(null);
    setPreviewUrl(currentImageUrl || null);
    setActiveTab("personal");
    setError("");
  }, [open, initialValue, currentImageUrl]);

  useEffect(() => {
    if (!image) return;
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const changed = useMemo(
    () => image !== null || JSON.stringify(form) !== JSON.stringify(initialValue),
    [form, image, initialValue],
  );

  const setField = (key: keyof BasicProfileForm, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const submit = async () => {
    if (!changed || saving) return;
    if (!form.fullName.trim()) {
      setError("Full name is required.");
      setActiveTab("personal");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          ...form,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        },
        image,
      );
      onClose();
    } catch (caught: any) {
      setError(
        caught?.response?.data?.message ||
          caught?.message ||
          "Profile update failed.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !saving) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border px-6 py-5">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                  <User className="h-3.5 w-3.5" />
                  My Profile
                </div>
                <h2 className="text-lg font-bold text-foreground">Edit basic information</h2>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  You can update your personal and contact information. Work email, role,
                  department, position, salary and employment details are managed by HR.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b border-border px-6 pt-3">
              <div className="flex gap-1 overflow-x-auto">
                {([
                  ["personal", "Personal", User],
                  ["contact", "Contact & Address", Phone],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`relative inline-flex min-w-fit items-center gap-2 px-4 py-3 text-xs font-semibold transition ${
                      activeTab === id
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {activeTab === id ? (
                      <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-6">
              {error ? (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-xs font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              ) : null}

              {activeTab === "personal" ? (
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background text-lg font-extrabold text-primary">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
                      ) : (
                        initials(form.fullName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">Profile image</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose a JPG, PNG or WEBP image.
                      </p>
                    </div>
                    <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-muted">
                      <Camera className="h-4 w-4" />
                      Change image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => setImage(event.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field label="Full Name">
                      <input
                        value={form.fullName}
                        onChange={(event) => setField("fullName", event.currentTarget.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Date of Birth">
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(event) => setField("dateOfBirth", event.currentTarget.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Marital Status">
                      <select
                        value={form.maritalStatus}
                        onChange={(event) => setField("maritalStatus", event.currentTarget.value)}
                        className={inputClass}
                      >
                        <option value="">Not set</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                        <option value="other">Other</option>
                      </select>
                    </Field>
                    <Field label="Gender">
                      <select
                        value={form.gender}
                        onChange={(event) => setField("gender", event.currentTarget.value)}
                        className={inputClass}
                      >
                        <option value="">Not set</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </Field>
                    <Field label="Nationality">
                      <input
                        value={form.nationality}
                        onChange={(event) => setField("nationality", event.currentTarget.value)}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setField("phone", event.currentTarget.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      value={form.city}
                      onChange={(event) => setField("city", event.currentTarget.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      value={form.address}
                      onChange={(event) => setField("address", event.currentTarget.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      value={form.country}
                      onChange={(event) => setField("country", event.currentTarget.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Zip Code">
                    <input
                      value={form.zipCode}
                      onChange={(event) => setField("zipCode", event.currentTarget.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {changed ? "Unsaved basic profile changes" : "No changes yet"}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="h-9 rounded-lg px-4 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!changed || saving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
