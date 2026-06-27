import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

type PrimaryLinkProps = {
  children: ReactNode;
  href: string;
  className?: string;
};

function getPrimaryButtonClassName(className = "") {
  return `inline-flex cursor-pointer items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`;
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: PrimaryButtonProps) {
  return (
    <button className={getPrimaryButtonClassName(className)} {...props}>
      {children}
    </button>
  );
}

export function PrimaryLink({
  children,
  href,
  className = "",
}: PrimaryLinkProps) {
  return (
    <Link className={getPrimaryButtonClassName(className)} href={href}>
      {children}
    </Link>
  );
}
