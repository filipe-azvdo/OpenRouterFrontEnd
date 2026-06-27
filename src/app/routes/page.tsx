import { SavedRoutes } from "@/components/route/SavedRoutes";

export const metadata = {
  title: "Rotas salvas — PersonalRouter",
};

export default function RoutesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="font-editorial text-h1 text-ink">Rotas salvas</h1>
        <p className="mt-2 text-base text-steel">
          Suas rotas persistidas — visualize no mapa ou remova.
        </p>
      </header>
      <SavedRoutes />
    </section>
  );
}
