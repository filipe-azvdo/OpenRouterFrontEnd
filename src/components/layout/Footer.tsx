import Link from "next/link";
import { SunsetStripe } from "./SunsetStripe";

/** Rodapé creme precedido pela sunset stripe (assinatura da marca). */
export function Footer() {
  return (
    <>
      <SunsetStripe />
      <footer className="bg-cream text-ink">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="font-editorial text-xl">PersonalRouter</p>
            <p className="mt-1 text-sm text-slate">
              Planejamento de rotas com paradas, perfis e pedágios.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/" className="text-primary hover:underline">
              Planejar rota
            </Link>
            <Link href="/routes" className="text-primary hover:underline">
              Rotas salvas
            </Link>
            <Link href="/tolls" className="text-primary hover:underline">
              Importar pedágios
            </Link>
            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              API (Swagger)
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
