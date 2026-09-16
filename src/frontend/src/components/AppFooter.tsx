/** Pie de página con la atribución de la plataforma. */
export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const hostname =
    typeof window === "undefined" ? "" : window.location.hostname;

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6">
        <p className="font-display text-lg font-semibold">Fulbito del Barrio</p>
        <p className="text-base text-muted-foreground">
          Partidos, plantel y asistencia del grupo en un solo lugar.
        </p>
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-1 text-base font-semibold text-primary underline-offset-4 transition-smooth hover:underline"
          data-ocid="footer.attribution_link"
        >
          © {currentYear}. Built with love using caffeine.ai
        </a>
      </div>
    </footer>
  );
}
