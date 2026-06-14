import type { ReactNode } from 'react';

interface PageTitleSectionProps {
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageTitleSection({ title, description, subtitle, actions }: PageTitleSectionProps) {
  const helperText = description || subtitle;

  return (
    /* PageTitleSection active */
    <div className="page-title-section">
      <div className="page-title-content">
        <h1 className="page-title">{title}</h1>
        {helperText && <p className="page-description">{helperText}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
