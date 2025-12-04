"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiUser, FiMessageCircle, FiFileText } from "react-icons/fi";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: FiHome, label: "Home" },
    { href: "/interview", icon: FiMessageCircle, label: "Interview" },
    { href: "/resume-builder", icon: FiFileText, label: "Resume" },
    { href: "/onboarding", icon: FiUser, label: "Profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-white/5 z-50 transition-colors duration-300">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href === "/dashboard" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-primary-500/10 dark:bg-primary-500/20" : ""}`}>
                <Icon className={`text-xl ${isActive ? "scale-105" : ""}`} />
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

