import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  value?: string | null;
  disabled?: boolean;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
};

export function ContactImageUpload({ value, disabled, onChange, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Use PNG, JPG/JPEG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      onChange(await onUpload(file));
    } catch (cause) {
      setError(
        (cause as any)?.response?.data?.message ||
          (cause as Error)?.message ||
          "Could not upload image.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className="text-[11px] font-bold text-muted-foreground">Profile picture</span>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/15 p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {value ? (
            <img src={value} alt="Contact" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold">PNG, JPG/JPEG or WebP</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Maximum 5 MB.</p>
          {error ? <p className="mt-1 text-[10px] font-semibold text-destructive">{error}</p> : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(event) => void pick(event.currentTarget.files?.[0])}
        />
        <div className="flex shrink-0 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-md"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {value ? "Replace" : "Upload"}
          </Button>
          {value ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-destructive"
              disabled={disabled || uploading}
              onClick={() => onChange(null)}
              aria-label="Remove profile image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
