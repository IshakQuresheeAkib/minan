import { LeadForm } from "@/features/checkout/components/LeadForm";

export const metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Checkout</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Share delivery details and optional bKash transaction ID for manual confirmation.
        </p>
        <LeadForm />
      </div>
      <aside className="h-fit rounded-lg border bg-card p-5 text-sm text-card-foreground shadow-sm">
        <h2 className="font-medium">Order Summary</h2>
        <p className="mt-2 leading-6 text-muted-foreground">
          Cart totals will be connected once product data and cart actions are wired.
        </p>
      </aside>
    </section>
  );
}
