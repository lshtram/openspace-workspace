import { useEffect, useRef, useState, type ReactNode } from "react"
import { serverDisplayName } from "../utils/server"
import type { ServerHealth } from "../utils/serverHealth"

type ServerRowProps = {
  url: string
  status?: ServerHealth
  dimmed?: boolean
  className?: string
  nameClassName?: string
  versionClassName?: string
  badge?: ReactNode
  trailing?: ReactNode
}

export function ServerRow({
  url,
  status,
  dimmed,
  className,
  nameClassName,
  versionClassName,
  badge,
  trailing,
}: ServerRowProps) {
  const nameRef = useRef<HTMLSpanElement | null>(null)
  const versionRef = useRef<HTMLSpanElement | null>(null)
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    const check = () => {
      const nameTruncated = nameRef.current ? nameRef.current.scrollWidth > nameRef.current.clientWidth : false
      const versionTruncated = versionRef.current ? versionRef.current.scrollWidth > versionRef.current.clientWidth : false
      setTruncated(nameTruncated || versionTruncated)
    }
    const frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame(check) : window.setTimeout(check, 0)
    window.addEventListener("resize", check)
    return () => {
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(frame as number)
      } else {
        clearTimeout(frame as number)
      }
      window.removeEventListener("resize", check)
    }
  }, [url, status?.version])

  const title = truncated ? `${serverDisplayName(url)}${status?.version ? ` ${status.version}` : ""}` : undefined

  return (
    <div className={className} title={title} style={{ opacity: dimmed ? 0.5 : 1 }}>
      <div
        className={
          status?.healthy === true
            ? "h-2 w-2 rounded-full bg-emerald-500"
            : status?.healthy === false
              ? "h-2 w-2 rounded-full bg-red-500"
              : "h-2 w-2 rounded-full bg-black/20"
        }
      />
      <span ref={nameRef} className={nameClassName ?? "truncate text-sm font-medium"}>
        {serverDisplayName(url)}
      </span>
      {status?.version && (
        <span ref={versionRef} className={versionClassName ?? "truncate text-xs text-muted"}>
          {status.version}
        </span>
      )}
      {badge}
      {trailing}
    </div>
  )
}
