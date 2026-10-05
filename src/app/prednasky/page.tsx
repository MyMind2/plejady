import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/server";
import { compareRoomNumbers } from "@/lib/rooms";
import { formatBlock } from "@/lib/time";
import { isStudentEmail } from "@/lib/validation";

type LectureSession = {
  id: string;
  blocks: {
    id: string;
    display_order: number;
    start_time: string;
    end_time: string;
  };
  lectures: {
    title: string;
    annotation: string;
    lecturers: {
      name: string;
      short_bio: string;
    };
  };
  rooms: {
    room_number: string;
  };
};

export default async function Lectures() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data: isAdmin } = user ? await db.rpc("is_admin") : { data: false };
  const { data: profile } =
    user && !isAdmin && isStudentEmail(user.email ?? "")
      ? await db
          .from("student_profiles")
          .select("class_name")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };
  const showNavigation = Boolean(profile?.class_name);

  const { data } = await db
    .from("sessions")
    .select(
      "id,blocks!sessions_block_event_fkey(id,display_order,start_time,end_time),lectures(title,annotation,lecturers(name,short_bio)),rooms!sessions_room_event_fkey(room_number)",
    )
    .eq("active", true);

  const sessions = (data ?? []) as unknown as LectureSession[];
  const blocks = Object.values(
    sessions.reduce<
      Record<
        string,
        { block: LectureSession["blocks"]; sessions: LectureSession[] }
      >
    >((grouped, session) => {
      const group = grouped[session.blocks.id] ?? {
        block: session.blocks,
        sessions: [],
      };
      group.sessions.push(session);
      grouped[session.blocks.id] = group;
      return grouped;
    }, {}),
  )
    .sort(
      (first, second) => first.block.display_order - second.block.display_order,
    )
    .map((group) => ({
      ...group,
      sessions: group.sessions.sort((first, second) =>
        compareRoomNumbers(first.rooms.room_number, second.rooms.room_number),
      ),
    }));

  return (
    <>
      {showNavigation && <Navigation />}
      <main className="mx-auto max-w-7xl px-5 py-9 sm:py-12">
        <Link
          href="/vyber"
          className="inline-flex rounded-lg px-2 py-2 text-sm font-semibold text-muted hover:bg-white hover:text-ink"
        >
          ← Zpět na výběr
        </Link>
        <div className="mt-5 max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-sun">
            SEZNAM PŘEDNÁŠEK
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Přednášky</h1>
          <p className="mt-3 leading-7 text-muted">
            Projděte si témata a přednášející ještě před sestavením svého
            programu.
          </p>
        </div>
        {blocks.length > 0 ? (
          <div className="mt-8 space-y-9">
            {blocks.map(({ block, sessions }) => (
              <section
                key={block.id}
                aria-labelledby={`block-${block.id}`}
                className="rounded-2xl border border-slate-200/90 bg-white/70 p-4 shadow-sm sm:p-5"
              >
                <h2
                  id={`block-${block.id}`}
                  className="text-xl font-bold tracking-tight"
                >
                  {formatBlock(block.start_time, block.end_time)}
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {sessions.map((session) => (
                    <article
                      key={session.id}
                      className="flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:p-3"
                    >
                      <p className="text-sm font-semibold text-sun">
                        Učebna {session.rooms.room_number}
                      </p>
                      <h3 className="mt-2 text-lg font-bold leading-snug">
                        {session.lectures.title}
                      </h3>
                      <p className="mt-2 text-sm font-semibold text-ink">
                        {session.lectures.lecturers.name}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-muted md:text-[13px] md:leading-5">
                        {session.lectures.annotation}
                      </p>
                      <p className="mt-auto border-t border-slate-100 pt-3 text-sm leading-5 text-muted">
                        {session.lectures.lecturers.short_bio}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-muted shadow-sm">
            Informace o přednáškách budou brzy doplněny.
          </p>
        )}
      </main>
    </>
  );
}
