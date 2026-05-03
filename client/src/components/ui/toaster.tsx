import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"

function ToastIcon({ variant }: { variant?: string | null }) {
  if (variant === "success")     return <CheckCircle2  className="w-4 h-4 text-[#00d084] shrink-0 mt-0.5" />
  if (variant === "warning")     return <AlertTriangle className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
  if (variant === "destructive") return <XCircle       className="w-4 h-4 text-[#ff4d4d] shrink-0 mt-0.5" />
  return                                <Info          className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <ToastIcon variant={variant} />
            <div className="flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
            <div className="toast-bar absolute bottom-0 left-0 h-[2px] w-full opacity-80" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
