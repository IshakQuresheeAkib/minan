import { FacebookPagePlugin } from "@/components/shared/FacebookPagePlugin";
import { env } from "@/config/env";

export function Footer() {
  const hasFacebookPage = Boolean(env.facebookPageUrl.trim());
  return (
    <footer className="border-t bg-background">
      <div
        className={`mx-auto w-full max-w-6xl gap-6 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] text-sm text-foreground/70 sm:px-6 lg:px-8 lg:pb-6 ${
          hasFacebookPage
            ? "grid md:grid-cols-[minmax(0,1fr)_minmax(0,560px)] md:items-start"
            : "flex flex-col gap-2"
        }`}
      >
        <div className="space-y-2">
          <p className="font-medium text-foreground">MINAN</p>
          <p>Kumarpara, Sylhet, Bangladesh</p>
        </div>
        {hasFacebookPage ? <FacebookPagePlugin /> : null}
      </div>
    </footer>
  );
}
