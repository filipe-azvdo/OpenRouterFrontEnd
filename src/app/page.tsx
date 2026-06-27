import { RoutePlanner } from "@/components/route/RoutePlanner";

export default function HomePage() {
  return (
    <>
      {/* Hero — gradiente de pôr do sol (assinatura da marca) */}
      <section className="sunset-hero">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/70">
            PersonalRouter
          </p>
          <h1 className="mt-3 max-w-3xl font-editorial text-hero text-ink">
            Planeje rotas, ponta a ponta.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-tint">
            Calcule trajetos com até 10 paradas, escolha o perfil de transporte e
            descubra os pedágios no caminho — tudo sobre o OpenRouteService.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <RoutePlanner />
      </section>
    </>
  );
}
