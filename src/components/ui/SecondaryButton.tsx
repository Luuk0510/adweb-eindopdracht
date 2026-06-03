import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type SecondaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "default" | "danger";
};

type SecondaryLinkProps = {
  children: ReactNode;
  href: string;
  variant?: "default" | "danger";
  className?: string;
};

function getSecondaryButtonClassName(
  variant: "default" | "danger",
  className = "",
) {
  const variantClassName =
    variant === "danger"
      ? "border-red-200 text-red-700 hover:bg-red-50"
      : "border-slate-300 text-slate-950 hover:bg-slate-50";

  return `cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${variantClassName} ${className}`;
}

export function SecondaryButton({
  children,
  variant = "default",
  className = "",
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={getSecondaryButtonClassName(variant, className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({
  children,
  href,
  variant = "default",
  className = "",
}: SecondaryLinkProps) {
  return (
    <Link
      className={getSecondaryButtonClassName(variant, className)}
      href={href}
    >
      {children}
    </Link>
  );
}
