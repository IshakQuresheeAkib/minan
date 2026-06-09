export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <section className="mx-auto flex min-h-[60dvh] w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal">Cart</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your selected items will appear here before checkout.
        </p>
      </div>
    </section>
  );
}
