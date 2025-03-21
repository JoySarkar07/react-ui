import React from 'react';
import './Card.css';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  width?: string;
  elevation?: 'low' | 'medium' | 'high';
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  width = '300px',
  elevation = 'medium',
}) => {
  return (
    <div className={`card card-elevation-${elevation}`} style={{ width }}>
      {title && <div className="card-title">{title}</div>}
      <div className="card-content">{children}</div>
    </div>
  );
};