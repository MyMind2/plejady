import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isStudentEmail } from "@/lib/validation";
import { Navigation } from "@/components/navigation";
import SelectionBoard from "./selection-board";
import { ClassSelection } from "./class-selection";

export default async function SelectionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin) redirect("/admin");
  if (!isStudentEmail(user.email ?? "")) redirect("/prihlaseni?chyba=domena");
  const { error } = await supabase.rpc("ensure_student_profile");
  if (error) redirect("/prihlaseni?chyba=domena");
  const { data: profile } = await supabase
    .from("student_profiles")
    .select("class_name")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      {profile?.class_name && <Navigation />}
      <main className="mx-auto max-w-6xl px-5 py-9 sm:py-12">
        <p className="text-sm font-semibold tracking-wide text-sun">
          VÁŠ DEN PLEJÁD
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Výběr přednášek
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Výběr se ukládá automaticky. V každém ze čtyř bloků si vyberte jednu
          přednášku.
        </p>
        {profile?.class_name ? <SelectionBoard /> : <ClassSelection />}
      </main>
    </>
  );
}
