import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentWatch — AI Agent Observability",
  description: "Track cost, traces, failures, and token usage across every agent run. Beautiful observability for your AI agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-void text-t-primary scrollbar-thin">
        {children}
      </body>
    </html>
  );
}
