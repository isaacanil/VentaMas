import type { ReactNode } from 'react';

type CatalogCardProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

const CatalogCard = ({ children, description, title }: CatalogCardProps) => {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      </div>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
};

export default CatalogCard;
