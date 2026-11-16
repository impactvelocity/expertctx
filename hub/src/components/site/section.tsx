import { cn } from "@/lib/utils";

export function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  center = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl space-y-3", center && "mx-auto text-center")}>
      {eyebrow ? <p className="font-semibold text-brand text-xs uppercase tracking-[0.08em]">{eyebrow}</p> : null}
      <h2 className="font-display text-4xl leading-[1.08]">{title}</h2>
      {description ? <p className="text-lg text-muted-foreground">{description}</p> : null}
    </div>
  );
}
