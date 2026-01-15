"use client";

import { processParams } from "@/i18n/dictionaries";
import { useSystem } from "@/providers/system.provider";
import { useRouter } from "next/navigation";

export const useLocale = () => {
    const { dictionary } = useSystem();
    const translate = (key: string, params?: any) => {
        try {
            if (!dictionary[key]) return key
            return processParams(dictionary[key as keyof typeof dictionary], params || {})
        } catch {
            return key
        }
    }

    const { locale } = useSystem();
    const router = useRouter();
    const push = (href: string, options?: any) => {
        router.push(`/${locale}${href}`, options);
    }

    return {
        t: translate,
        router: {
            ...router,
            push: push,
        }
    };
}