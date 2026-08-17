import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ContactOption,
  InfluencerPlatformAccount,
} from "../types/contact.types";

type Props = {
  value: InfluencerPlatformAccount[];
  options: ContactOption[];
  disabled?: boolean;
  onChange: (accounts: InfluencerPlatformAccount[]) => void;
  onCreatePlatform: () => void;
};

export function InfluencerPlatformsField({
  value,
  options,
  disabled,
  onChange,
  onCreatePlatform,
}: Props) {
  const platforms = options.filter((option) => option.type === "platform");

  const update = (index: number, patch: Partial<InfluencerPlatformAccount>) => {
    onChange(value.map((account, itemIndex) => (itemIndex === index ? { ...account, ...patch } : account)));
  };

  return (
    <div className="grid gap-2 sm:col-span-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground">Platforms</span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-[11px]"
            disabled={disabled}
            onClick={onCreatePlatform}
          >
            <Plus className="h-3.5 w-3.5" />
            New platform
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-lg px-2 text-[11px]"
            disabled={disabled}
            onClick={() =>
              onChange([
                ...value,
                {
                  platformOptionId: platforms[0]?.id || "",
                  handle: "",
                  profileUrl: "",
                  followerCount: null,
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add account
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-xs text-muted-foreground">
          Add a social platform account when this influencer has one.
        </div>
      ) : (
        <div className="grid gap-3">
          {value.map((account, index) => (
            <div key={account.id || index} className="rounded-xl border border-border bg-muted/15 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">Platform *</span>
                  <Select
                    value={account.platformOptionId || undefined}
                    disabled={disabled}
                    onValueChange={(platformOptionId) => update(index, { platformOptionId })}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <label className="grid gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">Handle</span>
                  <Input
                    value={account.handle || ""}
                    disabled={disabled}
                    onChange={(event) => update(index, { handle: event.currentTarget.value })}
                    placeholder="@username"
                    className="rounded-xl"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">Profile URL</span>
                  <Input
                    type="url"
                    value={account.profileUrl || ""}
                    disabled={disabled}
                    onChange={(event) => update(index, { profileUrl: event.currentTarget.value })}
                    placeholder="https://..."
                    className="rounded-xl"
                  />
                </label>

                <label className="grid gap-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground">Followers</span>
                  <Input
                    type="number"
                    min={0}
                    value={account.followerCount ?? ""}
                    disabled={disabled}
                    onChange={(event) =>
                      update(index, {
                        followerCount:
                          event.currentTarget.value === ""
                            ? null
                            : Number(event.currentTarget.value),
                      })
                    }
                    placeholder="120000"
                    className="rounded-xl"
                  />
                </label>
              </div>

              <div className="mt-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-lg text-[11px] text-muted-foreground hover:text-destructive"
                  disabled={disabled}
                  onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
