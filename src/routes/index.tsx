import { createFileRoute, Link } from '@tanstack/react-router';
import { formatNaira, fundedPercent } from '@/lib/currency';
import { sampleBills } from '@/lib/sampleBills';
import { ProgressBar } from '@/components/ProgressBar';
import { CategoryBadge, GlowBackdrop, GradientButton, SectionHeading, StatCard } from '@/components/ui/brand';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Chief — Pay a bill with a swipe' }] }),
  component: HomePage,
});

const stats = [
  { label: 'Raised this month', value: formatNaira(1000000) },
  { label: 'Bills fully paid', value: '142' },
  { label: 'Kind donors', value: '3,870' },
];
const steps = [
  { title: 'Swipe', body: 'Browse approved bills one card at a time. Swipe right to help, left to skip.' },
  { title: 'Give', body: 'Choose a bill and an amount that works for you.' },
  { title: 'See it paid', body: 'Follow the funding progress of the bills you care about.' },
];

function HeroCardStack() {
  const top = sampleBills[0];
  return (
    <div className="relative mx-auto w-full max-w-sm pb-6" aria-label="Example bill card">
      <div aria-hidden="true" className="absolute inset-3 rotate-6 rounded-3xl border border-primary/25 bg-primary/10" />
      <div aria-hidden="true" className="absolute inset-1 -rotate-3 rounded-3xl border border-border bg-muted" />
      <article className="ring-gradient shadow-elegant relative overflow-hidden rounded-3xl bg-card">
        <div className="relative aspect-[4/3] bg-muted">
          <img src={top.image || undefined} alt={top.title} loading="eager" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-2"><CategoryBadge category={top.category} /><span className="text-xs text-muted-foreground">{top.city}</span></div>
          <h2 className="text-lg font-semibold leading-snug">{top.title}</h2>
          <ProgressBar value={top.raised} goal={top.goal} label={`${top.title} funding progress`} />
          <div className="flex justify-between gap-2 text-sm"><span className="font-semibold">{formatNaira(top.raised)}</span><span className="text-muted-foreground">{fundedPercent(top.raised, top.goal)}% of {formatNaira(top.goal)}</span></div>
        </div>
      </article>
    </div>
  );
}

function HomePage() {
  return (
    <div className="overflow-x-clip text-foreground">
      <section className="relative isolate">
        <GlowBackdrop />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-12 md:grid-cols-2 md:pb-24 md:pt-20">
          <div className="animate-fade-up">
            <span className="glass inline-flex rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Verified bills · Real people</span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Pay a bill with a <span className="text-brand-gradient italic">swipe</span></h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">Chief connects people with urgent rent, school and hospital bills to donors who want to help. Every live bill is checked by our team before it goes live.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <GradientButton to="/discover" size="lg">Discover</GradientButton>
              <GradientButton to="/auth" variant="ghost" size="lg">Post a bill</GradientButton>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Already have an account? <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">Sign in</Link></p>
            <p className="mt-8 text-sm text-muted-foreground"><span className="font-semibold text-foreground">A little kindness</span> can make a big difference.</p>
          </div>
          <div className="animate-fade-up"><HeroCardStack /></div>
        </div>
      </section>
      <section aria-label="Sample stats" className="mx-auto max-w-6xl px-4 py-6">
        <div className="glass shadow-elegant grid gap-5 rounded-[2rem] px-6 py-10 sm:grid-cols-3 sm:px-10">
          {stats.map((stat) => <StatCard key={stat.label} value={stat.value} label={stat.label} />)}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Illustrative community statistics</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading eyebrow="Simple by design" title="How it works" />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="glass shadow-elegant rounded-3xl p-7">
              <span className="bg-brand-gradient flex h-10 w-10 items-center justify-center rounded-full font-bold text-primary-foreground">{index + 1}</span>
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <SectionHeading eyebrow="Explore the possibilities" title="A little help goes a long way" action={<Link to="/discover" className="rounded-full px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10">See all →</Link>} />
        <p className="mt-3 text-sm text-muted-foreground">Sample bills showing how giving works.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleBills.map((bill) => (
            <article key={bill.id} className="glass shadow-elegant overflow-hidden rounded-3xl">
              <div className="relative aspect-video bg-muted">
                <img src={bill.image || undefined} alt={bill.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute left-4 top-4"><CategoryBadge category={bill.category} className="bg-card/95" /></div>
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
                <h3 className="mt-1.5 text-lg font-semibold leading-snug">{bill.title}</h3>
                <ProgressBar value={bill.raised} goal={bill.goal} className="mt-5" label={`${bill.title} funding progress`} />
                <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold">{formatNaira(bill.raised)}</span><span className="text-muted-foreground">of {formatNaira(bill.goal)}</span></div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="glass ring-gradient shadow-elegant relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-12">
          <GlowBackdrop className="opacity-70" />
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-widest">Make it count</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold leading-tight sm:text-5xl">Someone's bill could be paid today</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Give a little, change a lot.</p>
          <div className="mt-8 flex justify-center"><GradientButton to="/discover" size="lg">Start helping now →</GradientButton></div>
          <p className="mt-6 text-sm text-muted-foreground">Returning donor? <Link to="/auth" className="font-semibold text-primary hover:underline">Sign in to your account</Link></p>
        </div>
      </section>
    </div>
  );
}
