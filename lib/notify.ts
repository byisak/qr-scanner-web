import { toast } from "sonner"

/*
 * 알림 한 줄 (alert() 대신). 화면 아래 가운데 토스트로 짧게 한 문장.
 *   notify.success(t("trash.restored"))
 *   notify.error(t("trash.restoreError"))
 *   notify("복사했어요")
 * 같은 id 를 주면 겹쳐 쌓이지 않고 바뀐다: notify.error(msg, { id: "save" })
 */
type Options = { id?: string | number; description?: string; duration?: number }

function base(message: string, options?: Options) {
  return toast(message, options)
}

export const notify = Object.assign(base, {
  success: (message: string, options?: Options) => toast.success(message, options),
  error: (message: string, options?: Options) => toast.error(message, { duration: 6000, ...options }),
  info: (message: string, options?: Options) => toast.info(message, options),
  warning: (message: string, options?: Options) => toast.warning(message, options),
  loading: (message: string, options?: Options) => toast.loading(message, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
  /** 비동기 작업: 진행 중 → 성공/실패 문구로 바뀜 */
  promise: <T,>(
    promise: Promise<T> | (() => Promise<T>),
    messages: { loading: string; success: string | ((data: T) => string); error: string | ((err: unknown) => string) }
  ) => toast.promise(promise, messages),
})
