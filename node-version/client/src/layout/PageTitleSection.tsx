import React, { ReactNode } from 'react';

interface PageTitleSectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function PageTitleSection({ title, description, actions }: PageTitleSectionProps) {
  return (
    /* PageTitleSection active */
    <div className="page-title-section">
      <div className="page-title-content">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
