import { type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <Navbar />
      <main className="flex-1 py-12 sm:py-16">{children}</main>
      <Footer />
    </div>
  );
}
