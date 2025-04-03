import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";

interface TabNavigationProps {
  activeTab: string;
  user: User | null;
}

export default function TabNavigation({ activeTab, user }: TabNavigationProps) {
  const isAdmin = user?.isAdmin || false;
  
  return (
    <div className="mb-6 border-b border-neutral-200">
      <ul className="flex space-x-8">
        <li>
          <Link href="/">
            <a className={`px-3 py-2 font-medium inline-block ${activeTab === "dashboard" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary"}`}>
              Dashboard
            </a>
          </Link>
        </li>
        <li>
          <Link href="/suggestions">
            <a className={`px-3 py-2 font-medium inline-block ${activeTab === "suggestions" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary"}`}>
              Öneriler
            </a>
          </Link>
        </li>
        <li>
          <Link href="/create">
            <a className={`px-3 py-2 font-medium inline-block ${activeTab === "create" 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-dark hover:text-primary"}`}>
              Yeni Öneri
            </a>
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link href="/admin">
              <a className={`px-3 py-2 font-medium inline-block ${activeTab === "admin" 
                ? "text-primary border-b-2 border-primary" 
                : "text-neutral-dark hover:text-primary"}`}>
                Yönetim
              </a>
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
