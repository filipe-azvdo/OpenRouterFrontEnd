import Link from "next/link";

const NAV = [
  { href: "/", label: "Planejar" },
  { href: "/routes", label: "Rotas salvas" },
  { href: "/tolls", label: "Pedágios" },
];

/** Barra de navegação superior — branca, sóbria, sticky (DESIGN.md). */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline-soft bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
              <path
                d="M12 21s-6.5-5.6-6.5-10A6.5 6.5 0 0 1 12 4.5 6.5 6.5 0 0 1 18.5 11c0 4.4-6.5 10-6.5 10Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            PersonalRouter
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-steel transition-colors hover:bg-surface hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
