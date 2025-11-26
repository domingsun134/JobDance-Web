"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiUser, FiMessageCircle, FiSettings, FiLogOut, FiFileText } from "react-icons/fi";
import { logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

import ThemeToggle from "./ThemeToggle";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { href: "/dashboard", icon: FiHome, label: "Home" },
        { href: "/interview", icon: FiMessageCircle, label: "Interview" },
        { href: "/resume-builder", icon: FiFileText, label: "Resume Builder" },
        { href: "/onboarding", icon: FiUser, label: "Profile" },
    ];

    const handleLogout = async () => {
        await logoutUser();
        router.push("/auth/login");
    };

    return (
        <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 z-50 transition-colors duration-300">
            {/* Logo Area */}
            <div className="p-6 flex flex-col items-center justify-center border-b border-gray-200 dark:border-white/5">
                {/* Animated Bars */}
                <div className="flex items-center justify-center gap-1.5 mb-3 h-12">
                    {/* Bar 1 */}
                    <div
                        className="w-2 bg-gradient-to-b from-blue-400 to-blue-300 rounded-lg animate-bar-short"
                        style={{ animationDelay: "0s" }}
                    ></div>
                    {/* Bar 2 */}
                    <div
                        className="w-2 bg-gradient-to-b from-orange-400 to-orange-300 rounded-lg animate-bar-long"
                        style={{ animationDelay: "0s" }}
                    ></div>
                    {/* Bar 3 */}
                    <div
                        className="w-2 bg-gradient-to-b from-blue-500 to-blue-400 rounded-lg animate-bar-short"
                        style={{ animationDelay: "0s" }}
                    ></div>
                    {/* Bar 4 */}
                    <div
                        className="w-2 bg-gradient-to-b from-pink-400 to-pink-300 rounded-lg animate-bar-long"
                        style={{ animationDelay: "0s" }}
                    ></div>
                    {/* Bar 5 */}
                    <div
                        className="w-2 bg-gradient-to-b from-green-400 to-green-300 rounded-lg animate-bar-short"
                        style={{ animationDelay: "0s" }}
                    ></div>
                </div>

                {/* Logo Image */}
                <div className="relative w-48 h-16">
                    <Image
                        src="/logo-text.png"
                        alt="JobDance"
                        fill
                        className="object-contain dark:invert-0 invert"
                        priority
                    />
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href === "/dashboard" && pathname === "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                ? "bg-primary-500/10 text-primary-600 dark:text-white shadow-lg shadow-primary-500/10 border border-primary-500/20"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                                }`}
                        >
                            <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-primary-500/20" : "group-hover:bg-gray-200 dark:group-hover:bg-white/10"}`}>
                                <Icon className={`text-lg transition-transform ${isActive ? "scale-105 text-primary-600 dark:text-primary-400" : ""}`} />
                            </div>
                            <span className={`font-medium ${isActive ? "text-primary-700 dark:text-primary-100" : ""}`}>{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User / Logout Section */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between px-4">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Theme</span>
                    <ThemeToggle />
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all duration-200 group"
                >
                    <div className="p-1.5 rounded-lg group-hover:bg-red-100 dark:group-hover:bg-red-500/20 transition-all">
                        <FiLogOut className="text-lg" />
                    </div>
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
