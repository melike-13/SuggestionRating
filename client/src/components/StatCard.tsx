import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconColor?: string;
}

export default function StatCard({ title, value, icon, iconColor = "text-primary" }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-dark text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-dark">{value}</h3>
        </div>
        <span className={`material-icons ${iconColor}`}>{icon}</span>
      </div>
    </div>
  );
}
