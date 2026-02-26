interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold tracking-tight text-white">{title}</h2>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
