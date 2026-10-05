import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-12 sm:py-20">
      <section className="w-full rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-14 flex flex-col items-center text-center">
        <h1 className="sr-only">Plejády</h1>
        <Image
          src="/plejady-logo.svg"
          alt="Plejády"
          width={6144}
          height={8196}
          priority
          sizes="(max-width: 640px) 80vw, 384px"
          className="h-auto w-full max-w-sm object-contain"
        />
        <p className="mt-3 max-w-2xl text-lg leading-8 text-muted">
          Jeden den, čtyři bloky a přednášky, které si sestavíte podle sebe.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap flex flex-wrap justify-center gap-4">
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-ink px-6 py-3 font-semibold text-white shadow-sm hover:bg-ink/90"
            href="/prihlaseni"
          >
            Přihlásit pomocí školního účtu
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-ink bg-white px-6 py-3 font-semibold text-ink shadow-sm hover:bg-slate-50"
            href="/prednasky"
          >
            Přednášky
          </Link>
        </div>
        <p className="mt-10 flex flex-wrap gap-x-2 gap-y-2 text-sm text-muted">
          <Link
            className="underline underline-offset-4 hover:text-ink"
            href="/hoste"
          >
            Registrace hostů
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            className="underline underline-offset-4 hover:text-ink"
            href="/ochrana-osobnich-udaju"
          >
            Ochrana osobních údajů
          </Link>
        </p>
      </section>
    </main>
  );
}
