import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navigation } from "@/components/navigation";
import { formatBlock } from "@/lib/time";
import { isStudentEmail } from "@/lib/validation";
import Link from "next/link";

export default async function Program() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/prihlaseni");

  const { data: isAdmin } = await db.rpc("is_admin");
  if (!isAdmin) {
    if (!isStudentEmail(user.email ?? "")) {
      redirect("/prihlaseni?chyba=domena");
    }

    const { error: profileError } = await db.rpc("ensure_student_profile");
    if (profileError) redirect("/prihlaseni?chyba=domena");

    const { data: profile } = await db
      .from("student_profiles")
      .select("class_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.class_name) redirect("/vyber");
  }

  const { data } = await db
    .from("student_selections")
    .select(
      "blocks(start_time,end_time,display_order),sessions(lectures(title,lecturers(name)),rooms!sessions_room_event_fkey(room_number))",
    );
  const selections = (data ?? []).sort(
    (first, second) => first.blocks.display_order - second.blocks.display_order,
  );

  return (
    <>
      <Navigation />
      <main className="mx-auto max-w-3xl px-5 py-9 sm:py-12">
        <p className="text-sm font-semibold tracking-wide text-sun">
          VÁŠ DEN PLEJÁD
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Můj program
        </h1>
        <p className="mt-3 leading-7 text-muted">
          {selections.length === 4
            ? "Máte hotový program pro všechny čtyři bloky."
            : `Zatím máte vybráno ${selections.length} ze 4 bloků.`}
        </p>
        {selections.length > 0 ? (
          <div className="mt-8 space-y-4">
            {selections.map((row: any, index: number) => (
              <article
                key={index}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:gap-6 sm:p-6"
              >
                <div className="inline-flex rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-ink sm:min-w-32 sm:justify-center">
                  {formatBlock(row.blocks.start_time, row.blocks.end_time)}
                </div>
                <div className="mt-4 min-w-0 sm:mt-0 sm:flex-1">
                  <h2 className="text-xl font-bold leading-snug">
                    {row.sessions.lectures.title}
                  </h2>
                  <p className="mt-1 text-muted">
                    {row.sessions.lectures.lecturers.name}
                  </p>
                </div>
                <p className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-ink sm:mt-0">
                  Učebna {row.sessions.rooms.room_number}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-7 shadow-sm">
            <h2 className="text-lg font-bold">Program zatím není vybraný</h2>
            <p className="mt-2 leading-6 text-muted">
              Vyberte si jednu přednášku v každém bloku. Výběr se uloží
              automaticky.
            </p>
            <Link
              href="/vyber"
              className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-ink px-5 py-2 font-semibold text-white shadow-sm hover:bg-ink/90"
            >
              Vybrat přednášky
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
