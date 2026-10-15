/**
 * Brand mark and wordmark, matching components/Logo.tsx on the main site.
 * The badge PNG is served from /public/brand.
 */
export function Logo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <img
        src="/brand/dsm-badge.png"
        alt=""
        width={800}
        height={635}
        decoding="async"
        className={markClassName ?? 'h-full w-auto shrink-0'}
      />
      {wordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[0.95em] font-semibold uppercase tracking-[0.02em] text-fg">
            Desert Sands
          </span>
          <span className="font-display text-[0.62em] font-semibold uppercase tracking-[0.34em] text-sand">
            Mechanical
          </span>
        </span>
      )}
    </span>
  );
}
