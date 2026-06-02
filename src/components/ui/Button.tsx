import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-md " +
  "transition-[transform,background-color,border-color] duration-150 active:translate-y-px " +
  "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  // Primário: fundo navy, texto azul-claro.
  primary: "bg-navy text-text-on-dark hover:bg-navy-90 outline-navy",
  // Secundário: contorno navy, fundo transparente.
  secondary:
    "border border-navy/30 text-navy bg-transparent hover:bg-navy/5 outline-navy",
  // Destrutivo (rejeitar/cancelar): vermelho de marca.
  destructive: "bg-red text-white hover:bg-[#a8161f] outline-red",
  ghost: "text-navy hover:bg-navy/5 outline-navy",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[0.85rem]",
  md: "h-11 px-5 text-[0.9375rem]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`.trim();
}

type ButtonProps = CommonProps & ComponentProps<"button">;
type LinkButtonProps = CommonProps & { href: string } & Omit<ComponentProps<typeof Link>, "href">;

export function Button({ variant, size, className = "", children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({ variant, size, className = "", children, href, ...rest }: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
