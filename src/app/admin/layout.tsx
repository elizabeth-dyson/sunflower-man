import LogoutButton from '@/components/LogoutButton';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sunflower Admin Panel",
  description: "Manage seed inventory and garden planning",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
