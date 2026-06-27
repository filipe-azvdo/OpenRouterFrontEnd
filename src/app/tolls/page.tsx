import { TollImport } from "@/components/tolls/TollImport";

export const metadata = {
  title: "Importar pedágios — PersonalRouter",
};

export default function TollsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="font-editorial text-h1 text-ink">Praças de pedágio</h1>
        <p className="mt-2 text-base text-steel">
          Sincronize a base de praças via upload de CSV.
        </p>
      </header>
      <TollImport />
    </section>
  );
}
