import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { LanguageSwitch } from "@/components/language-switch";
import { Masthead } from "@/components/masthead";
import { PurchaseBuildButton } from "@/components/purchase-build-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { type CatalogItemType, getCatalogItemDetailView } from "@/lib/server/catalog-service";
import { getRequestLanguage } from "@/lib/server/lang";

function parseCatalogType(value: string): CatalogItemType | null {
  const allowed: CatalogItemType[] = [
    "gpu",
    "cpu",
    "ram_kit",
    "power_supply",
    "case",
    "motherboard",
    "compact_ai_system",
    "storage_drive",
    "cpu_cooler",
  ];
  return allowed.includes(value as CatalogItemType) ? (value as CatalogItemType) : null;
}

export default async function CatalogDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const lang = await getRequestLanguage();
  const resolvedParams = await params;
  const itemType = parseCatalogType(resolvedParams.type);
  const itemId = Number.parseInt(resolvedParams.id, 10);

  if (!itemType || !Number.isFinite(itemId) || itemId <= 0) {
    notFound();
  }

  const item = getCatalogItemDetailView(itemType, itemId);
  if (!item) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <Masthead />
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="label-pill inline-block">
                Home
              </Link>
              <Link href="/about" className="label-pill inline-block">
                About
              </Link>
              <Link href="/faq" className="label-pill inline-block">
                FAQ
              </Link>
              <LanguageSwitch lang={lang} />
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AuthPanel />
            </div>
          </div>

          <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight md:text-6xl">{item.name}</h1>
          <p className="mt-3 text-lg text-[color:var(--muted)]">{item.subtitle}</p>
        </header>

        <section className="wireframe-panel p-6">
          <h2 className="font-display text-3xl font-semibold">Details</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {item.specs.map((spec) => (
              <div key={spec.label} className="rounded-lg border border-[color:var(--panel-border)] p-3">
                <p className="text-xs uppercase tracking-wide text-[color:var(--muted)]">{spec.label}</p>
                <p className="mt-1 text-sm">{spec.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wireframe-panel mt-6 p-6">
          <h2 className="font-display text-3xl font-semibold">Pricing & Purchase</h2>
          <p className="mt-3 text-sm text-[color:var(--muted)]">Base price: €{item.basePriceEur}</p>
          {item.marketAvgEur !== null ? (
            <p className="text-sm text-[color:var(--muted)]">Estonian market average: €{item.marketAvgEur.toFixed(2)}</p>
          ) : null}
          <p className="mt-1 text-base font-semibold">Preorder price: €{item.preorderPriceEur}</p>
          <PurchaseBuildButton
            itemType={item.checkoutItemType}
            itemId={item.itemId}
            priceEur={item.preorderPriceEur}
            buttonLabel={`Purchase for €${item.preorderPriceEur}`}
          />
          <div className="mt-5">
            <Link href="/" className="label-pill inline-block">
              Back to catalog
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
