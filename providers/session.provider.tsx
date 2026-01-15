"use client";


import { createContext, ReactNode, useContext } from "react"

export const AuthContext = createContext<any>({ session: null })

export const SessionProvider = ({ children, session }: { children: ReactNode, session: any }) => {
    return <AuthContext.Provider value={{ session }}>
        {children}
    </AuthContext.Provider>
}

export const useSession = () => {
    return useContext(AuthContext)
}