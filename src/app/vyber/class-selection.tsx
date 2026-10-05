"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { studentClasses, studentClassSchema } from "@/lib/student-classes";
import { friendlyError } from "@/lib/validation";

export function ClassSelection() {
  const router = useRouter();
  const [className, setClassName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = studentClassSchema.safeParse(className);
    if (!parsed.success) {
      setError("Vyberte prosím svou třídu.");
      return;
    }

    setSaving(true);
    setError("");
    const { error: saveError } = await createClient().rpc("set_student_class", {
      p_class_name: parsed.data,
    });
    if (saveError) {
      setError(friendlyError(saveError.message));
      setSaving(false);
      return;
    }

    router.refresh();
  }

  return (
    <section
      className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="class-heading"
    >
      <h2 id="class-heading" className="text-xl font-bold">
        Nejdříve vyberte svou třídu
      </h2>
      <p className="mt-2 leading-6 text-muted">
        Třídu potřebujeme pro přípravu seznamů na přednášky.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label htmlFor="student-class" className="block text-sm font-semibold">
          Třída
          <select
            id="student-class"
            name="className"
            required
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            disabled={saving}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 shadow-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/20 disabled:bg-slate-100"
          >
            <option value="">Vyberte třídu</option>
            {studentClasses.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="min-h-12 w-full rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-sm hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? "Ukládám…" : "Uložit třídu a pokračovat"}
        </button>
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
