export const locales = ["en", "pt"];
export const defaultLocale = "en";

const dictionaries = {
    pt: () => import('./dictionaries/pt.json').then((module) => module.default),
}
export type Locale = keyof typeof dictionaries

export const hasLocale = (locale: string): locale is Locale =>
    locale in dictionaries

export const getDictionary = async (locale: Locale) => {
    try {
        return await dictionaries[locale as Locale]()
    } catch {
        return {}
    }
}

export const processParams = (value: string, params?: any): any => {
    if (params) {
        value = value.replace(/{(\w+)}/g, (match: string, key: string) => params[key] || match)
    }
    return value
}

export const t = async (key: string, dictionary: any, params?: any) => {
    try {
        if (!dictionary[key]) return key
        return processParams(dictionary[key as keyof typeof dictionary], params)
    } catch {
        return key
    }
}
