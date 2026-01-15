"use client";
import { useSystem } from "@/providers/system.provider";
import Link, { LinkProps } from "next/link";

export const LocaleLink = ({ href, className, children, ...props }: { href: string, className?: string, children?: React.ReactNode } & LinkProps) => {
    const { locale } = useSystem();
    return <Link href={`/${locale}${href}`} className={className} {...props}>{children}</Link>;
};
