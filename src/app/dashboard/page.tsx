"use client";

import { logout } from "@/services/authService";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Je bent ingelogd.</p>

      <button
        className="mt-6 rounded bg-black px-4 py-2 text-white"
        onClick={handleLogout}
      >
        Uitloggen
      </button>
    </main>
  );
}