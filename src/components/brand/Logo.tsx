import Image from "next/image";
import Link from "next/link";

/** EMM horizontal lockup ({E…} MM), links home. White variant for dark bars. */
export function Logo({ variant = "color", className = "" }: { variant?: "color" | "white"; className?: string }) {
  const src =
    variant === "white"
      ? "/brand/emm-lockup-horizontal-white.png"
      : "/brand/emm-lockup-horizontal.png";
  return (
    <Link href="/" className={`inline-flex items-center ${className}`} aria-label="Salas da Estação — início">
      <Image src={src} alt="Estação Musical de Monção" width={150} height={54} priority className="h-9 w-auto" />
    </Link>
  );
}
