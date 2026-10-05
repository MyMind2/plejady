"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/validation";
import { formatBlock } from "@/lib/time";
import { compareRoomNumbers } from "@/lib/rooms";

type Session = {
  id: string;
  block_id: string;
  lectures: { title: string; lecturers: { name: string } };
};
type Block = {
  id: string;
  display_order: number;
  start_time: string;
  end_time: string;
};
type Availability = {
  session_id: string;
  registrations: number;
  capacity: number;
  room_number: string;
};

export default function SelectionBoard() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [availability, setAvailability] = useState<
    Record<string, Availability>
  >({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [eventId, setEventId] = useState<string>();
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState<string>();

  const load = useCallback(async () => {
    const db = createClient();
    const { data: event } = await db
      .from("events")
      .select("id")
      .order("event_date")
      .limit(1)
      .maybeSingle();
    if (!event) return;
    setEventId(event.id);
    const [{ data: bs }, { data: ss }, { data: mine }, { data: cap }] =
      await Promise.all([
        db
          .from("blocks")
          .select("*")
          .eq("event_id", event.id)
          .order("display_order"),
        db
          .from("sessions")
          .select("id,block_id,lectures(title,lecturers(name))")
          .eq("event_id", event.id)
          .eq("active", true),
        db.from("student_selections").select("block_id,session_id"),
        db.rpc("session_availability", { p_event_id: event.id }),
      ]);
    setBlocks(bs ?? []);
    setSessions((ss ?? []) as unknown as Session[]);
    setSelected(
      Object.fromEntries(
        (mine ?? []).map((choice) => [choice.block_id, choice.session_id]),
      ),
    );
    setAvailability(
      Object.fromEntries(
        ((cap ?? []) as Availability[]).map((item) => [item.session_id, item]),
      ),
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const focused = () => void load();
    addEventListener("focus", focused);
    return () => {
      clearTimeout(timer);
      removeEventListener("focus", focused);
    };
  }, [load]);

  async function choose(id: string) {
    if (!eventId) return;
    setSaving(id);
    setNotice("");
    const { error } = await createClient().rpc("select_session", {
      p_session_id: id,
    });
    if (error) {
      setNotice(friendlyError(error.message));
      setSaving(undefined);
      return;
    }
    await load();
    setNotice("Výběr byl uložen.");
    setSaving(undefined);
  }

  const complete = Object.keys(selected).length;

  return (
    <section className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:px-5">
        <p className="font-semibold">
          {complete === 4
            ? "✓ Máte vybráno ve všech blocích."
            : `Vybráno ${complete} ze 4 bloků`}
        </p>
        <p className="text-sm text-muted">Výběr se uloží po kliknutí.</p>
      </div>
      {notice && (
        <p
          role="status"
          className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-sm"
        >
          {notice}
        </p>
      )}
      <div className="space-y-9">
        {blocks.map((block) => (
          <section
            key={block.id}
            aria-labelledby={`block-${block.id}`}
            className="rounded-2xl border border-slate-200/90 bg-white/70 p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2
                id={`block-${block.id}`}
                className="text-xl font-bold tracking-tight"
              >
                {formatBlock(block.start_time, block.end_time)}
              </h2>
              <span className="text-sm font-medium text-muted">
                Blok {block.display_order}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {sessions
                .filter((session) => session.block_id === block.id)
                .sort((first, second) =>
                  compareRoomNumbers(
                    availability[first.id]?.room_number ?? "",
                    availability[second.id]?.room_number ?? "",
                  ),
                )
                .map((session) => {
                  const cap = availability[session.id];
                  const isSelected = selected[block.id] === session.id;
                  const full = cap && cap.registrations >= cap.capacity;
                  const disabled = Boolean(saving) || (!isSelected && full);
                  const remaining = cap
                    ? cap.capacity - cap.registrations
                    : null;

                  return (
                    <button
                      disabled={disabled}
                      onClick={() => choose(session.id)}
                      key={session.id}
                      aria-pressed={isSelected}
                      className={`min-h-44 rounded-xl border p-4 text-left shadow-sm ${isSelected ? "border-ink bg-blue-50 ring-2 ring-ink ring-offset-2" : full ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-md"} disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${isSelected ? "bg-ink text-white" : full ? "bg-slate-300 text-slate-700" : "bg-slate-100 text-muted"}`}
                      >
                        {isSelected
                          ? "✓ Vybráno"
                          : full
                            ? "⊘ Obsazeno"
                            : "Vybrat přednášku"}
                      </span>
                      <strong className="mt-3 block leading-snug">
                        {session.lectures.title}
                      </strong>
                      <span className="mt-2 block text-sm text-muted">
                        {session.lectures.lecturers.name}
                      </span>
                      <span className="mt-4 block border-t border-slate-100 pt-3 text-sm font-medium">
                        {cap
                          ? `Učebna ${cap.room_number}`
                          : "Učebna není dostupná"}
                      </span>
                      <span className="mt-1 block text-sm text-muted">
                        {cap
                          ? full
                            ? `Obsazeno · ${cap.registrations} / ${cap.capacity}`
                            : `Zbývá ${remaining} míst · ${cap.registrations} / ${cap.capacity}`
                          : "Kapacita není dostupná"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
