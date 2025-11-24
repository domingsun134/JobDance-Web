"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiUser, FiMessageCircle, FiSettings } from "react-icons/fi";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: FiHome, label: "Home" },
    { href: "/interview", icon: FiMessageCircle, label: "Interview" },
    { href: "/onboarding", icon: FiUser, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-dark border-t border-white/5 z-50 safe-area-inset-bottom shadow-lg">
      <div className="max-w-md mx-auto px-3">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href === "/dashboard" && pathname === "/");
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-primary-500/20" : "hover:bg-gray-800/30"}`}>
                  <Icon className={`text-lg transition-transform ${isActive ? "scale-105" : ""}`} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? "text-primary-300" : "text-gray-500"}`}>{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary-400 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

