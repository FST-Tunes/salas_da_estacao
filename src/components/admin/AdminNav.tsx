"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, CalendarCheck, Door, Gear } from "@phosphor-icons/react";

const links = [
  { href: "/admin", label: "Painel", Icon: SquaresFour },
  { href: "/admin/reservas", label: "Reservas", Icon: CalendarCheck },
  { href: "/admin/salas", label: "Salas", Icon: Door },
  { href: "/admin/definicoes", label: "Definições", Icon: Gear },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Gestão">
      {links.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-navy text-text-on-dark" : "text-navy hover:bg-navy/5"
            }`}
          >
            <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
