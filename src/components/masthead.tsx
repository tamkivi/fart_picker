import Link from "next/link";

export function Masthead() {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
      <Link href="/" className="font-display text-3xl font-semibold tracking-tight">
        fart_picker
      </Link>
      <p className="font-mono text-xs text-[color:var(--muted)]">AI Workstation Preorder</p>
    </div>
  );
}
