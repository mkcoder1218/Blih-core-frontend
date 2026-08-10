import { Search, Send, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CalendarPerson,
  UserCalendarEvent,
} from "../../../api/calendar";

interface MeetingAttendeePopoverProps {
  event: UserCalendarEvent;
  people: CalendarPerson[];
  currentUserId?: string;
  query: string;
  x: number;
  y: number;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  onSelect: (person: CalendarPerson) => void;
}

function getPosition(x: number, y: number) {
  const width = 340;
  const height = 390;
  const padding = 16;

  return {
    left: Math.max(
      padding,
      Math.min(x, window.innerWidth - width - padding),
    ),
    top: Math.max(
      padding,
      Math.min(y, window.innerHeight - height - padding),
    ),
  };
}

export function MeetingAttendeePopover({
  event,
  people,
  currentUserId,
  query,
  x,
  y,
  onQueryChange,
  onClose,
  onSelect,
}: MeetingAttendeePopoverProps) {
  const normalizedQuery = query.trim().toLowerCase();

  const filteredPeople = people
    .filter((person) => person.id !== currentUserId)
    .filter((person) => {
      if (!normalizedQuery) return true;
      return person.fullName.toLowerCase().includes(normalizedQuery);
    })
    .slice(0, 8);

  const position = getPosition(x, y);

  return (
    <>
      <button
        type="button"
        aria-label="Close attendee selector"
        className="fixed inset-0 z-[69] cursor-default bg-transparent"
        onClick={onClose}
      />

      <div
        className="fixed z-[70] w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={position}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-950">Request a meeting</p>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                Choose someone, then add more attendees if needed.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-slate-400 transition hover:text-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.currentTarget.value)}
              placeholder="Search employee..."
              className="pl-9"
            />
          </div>

          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
            {filteredPeople.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <UserRound className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-bold text-slate-700">No employees found</p>
                <p className="mt-1 text-xs text-slate-500">Try another name.</p>
              </div>
            ) : (
              filteredPeople.map((person) => (
                <Button
                  key={person.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onSelect(person)}
                  className="h-auto w-full justify-start gap-3 rounded-xl px-3 py-2.5 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-black text-blue-700">
                    {person.fullName
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {person.fullName}
                    </span>
                  </span>

                  <Send className="h-4 w-4 shrink-0 text-blue-600" />
                </Button>
              ))
            )}
          </div>

          <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] font-semibold leading-4 text-slate-400">
            Availability is checked for the meeting time you choose, not the person's current status.
          </p>
        </div>
      </div>
    </>
  );
}
