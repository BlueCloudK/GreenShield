import { Button } from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="glass-panel rounded-3xl p-10">
        <p className="section-kicker">404</p>
        <h1 className="mt-3 text-4xl font-black text-white">Page not found</h1>
        <p className="mt-4 text-slate-400">This route does not exist in the GreenShield MVP demo.</p>
        <Button className="mt-8" to="/">
          Back home
        </Button>
      </div>
    </section>
  );
}
