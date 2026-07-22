export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-header mb-5 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="page-eyebrow mb-1 text-xs font-medium text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="page-title text-xl font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="page-description mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="page-actions flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </div>
  );
}
