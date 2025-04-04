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
          <Link href="/" className={`px-3 py-2 font-medium inline-block ${activeTab === "dashboard" 
            ? "text-primary border-b-2 border-primary" 
            : "text-neutral-dark hover:text-primary"}`}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/suggestions" className={`px-3 py-2 font-medium inline-block ${activeTab === "suggestions" 
            ? "text-primary border-b-2 border-primary" 
            : "text-neutral-dark hover:text-primary"}`}>
            Öneriler
          </Link>
        </li>
        <li>
          <Link href="/create" className={`px-3 py-2 font-medium inline-block ${activeTab === "create" 
            ? "text-primary border-b-2 border-primary" 
            : "text-neutral-dark hover:text-primary"}`}>
            Yeni Öneri
          </Link>
        </li>
        {isAdmin && (
          <>
            <li>
              <Link href="/admin" className={`px-3 py-2 font-medium inline-block ${activeTab === "admin" 
                ? "text-primary border-b-2 border-primary" 
                : "text-neutral-dark hover:text-primary"}`}>
                Yönetim
              </Link>
            </li>
            <li>
              <Link href="/users" className={`px-3 py-2 font-medium inline-block ${activeTab === "users" 
                ? "text-primary border-b-2 border-primary" 
                : "text-neutral-dark hover:text-primary"}`}>
                Kullanıcılar
              </Link>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
