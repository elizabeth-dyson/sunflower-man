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
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
