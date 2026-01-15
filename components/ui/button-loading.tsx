import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ReactNode } from "react"

interface IProps {
    children: ReactNode
    isLoading: boolean
}

export function ButtonLoading({ children, isLoading, ...props }: IProps & React.ComponentProps<typeof Button>) {
    return (
        <Button {...props} disabled={isLoading}>
            {isLoading ? <Spinner /> : null}
            {children}
        </Button>
    )
}
