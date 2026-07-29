import type { ReactNode } from "react";

type PanelCardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
};

export function PanelCard({
  title,
  description,
  children,
  action,
}: Readonly<PanelCardProps>) {
  return (
    <section className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:rounded-3xl sm:p-6">
      {title || description || action ? (
        <div className="mb-3 flex min-w-0 flex-col gap-3 sm:mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-bold text-slate-950 sm:text-lg">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="w-full min-w-0 shrink-0 sm:w-auto">{action}</div> : null}
        </div>
      ) : null}

      <div className="min-w-0 w-full max-w-full">{children}</div>
    </section>
  );
}
