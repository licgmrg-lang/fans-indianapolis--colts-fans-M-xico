import type { Metadata } from "next";
import { headers } from "next/headers";
import PwaRuntime from "./PwaRuntime";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = new URL("/og.png", `${protocol}://${host}`).toString();

  return {
    title: "Project Horseshoe · Colts Fans México",
    description:
      "La casa digital de Colts Fans México: credencial, eventos, quiniela, memorias y comunidad.",
    applicationName: "Project Horseshoe",
    manifest: "/manifest.webmanifest",
    themeColor: "#002c5f",
    openGraph: {
      title: "Project Horseshoe · Colts Fans México",
      description: "La herradura nos reúne.",
      type: "website",
      locale: "es_MX",
      images: [{ url: socialImage, width: 1664, height: 928, alt: "Project Horseshoe · Colts Fans México" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Project Horseshoe · Colts Fans México",
      description: "La herradura nos reúne.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <PwaRuntime />
      </body>
    </html>
  );
}
