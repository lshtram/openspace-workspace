import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Message, Part, AssistantMessage, ToolPart } from "../lib/opencode/v2/gen/types.gen"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { Copy, Check, ChevronDown, ChevronRight, Brain, Terminal as ToolIcon } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { cn } from "../lib/utils"

type MessageListProps = {
  messages: Message[]
  parts: Record<string, Part[]>
  isPending?: boolean
}

const isAssistantMessage = (message: Message): message is AssistantMessage => message.role === "assistant"

export function MessageList({ messages, parts, isPending }: MessageListProps) {
  const ordered = useMemo(() => [...messages].sort((a, b) => a.time.created - b.time.created), [messages])
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const turns = useMemo(() => {
    const result: { user?: Message; assistants: Message[]; id: string }[] = []
    let currentTurn: { user?: Message; assistants: Message[]; id: string } | null = null

    ordered.forEach((msg) => {
      if (msg.role === "user") {
        if (currentTurn) result.push(currentTurn)
        currentTurn = { user: msg, assistants: [], id: msg.id }
      } else if (msg.role === "assistant") {
        if (!currentTurn) {
          currentTurn = { assistants: [msg], id: msg.id }
        } else {
          currentTurn.assistants.push(msg)
        }
      }
    })
    if (currentTurn) result.push(currentTurn)
    return result
  }, [ordered])

  useEffect(() => {
    if (isPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStartTime((prev) => prev ?? Date.now())
    } else {
      setStartTime(null)
      setElapsed(0)
    }
  }, [isPending])

  useEffect(() => {
    let interval: number
    if (startTime) {
      interval = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <ScrollArea.Root className="h-full w-full overflow-hidden bg-white">
      <ScrollArea.Viewport className="h-full w-full">
        <div className="flex flex-col max-w-[840px] mx-auto pb-40">
          {turns.map((turn) => {
            const allAssistantParts = turn.assistants.flatMap(a => parts[a.id] ?? [])
            const stepParts = allAssistantParts.filter(p => p.type === "reasoning" || p.type === "tool")
            const contentParts = allAssistantParts.filter(p => p.type === "text" || p.type === "file" || p.type === "patch")
            const lastAssistant = turn.assistants.at(-1)
            const error = lastAssistant && isAssistantMessage(lastAssistant) ? lastAssistant.error : undefined

            return (
              <div key={turn.id} className="flex flex-col relative">
                {turn.user && (
                  <UserMessageItem 
                    message={turn.user} 
                    parts={parts[turn.user.id] ?? []} 
                  />
                )}
                
                <div className="flex flex-col px-6 py-2">
                  {error && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50/30 p-3 text-[13px] text-red-600">
                      {typeof error.data?.message === "string" ? error.data.message : error.name}
                    </div>
                  )}

                  {stepParts.length > 0 && <StepsFlow parts={stepParts} />}

                  <div className="flex flex-col gap-2">
                    {contentParts.map((part) => (
                      <PartRenderer key={part.id} part={part} />
                    ))}
                  </div>

                  {turn.assistants.length > 0 && (
                    <div className="mt-2 self-end flex items-center gap-2">
                      <span className="text-[10px] text-black/10 font-bold uppercase tabular-nums">
                        {new Date(turn.assistants[0].time.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <CopyButton text={contentParts.filter(p => p.type === "text").map(p => p.type === "text" ? p.text : "").join("\n")} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {isPending && (
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-black/40">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>thinking {elapsed > 0 && `${elapsed}s`}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar orientation="vertical" className="w-1.5 p-0.5">
        <ScrollArea.Thumb className="rounded-full bg-black/10" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  )
}

function UserMessageItem({ message, parts }: { message: Message; parts: Part[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const text = parts.filter(p => p.type === "text").map(p => p.type === "text" ? p.text : "").join("\n")
  const isLong = text.split('\n').length > 3 || text.length > 200

  return (
    <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md transition-colors">
      <div className="px-6 pt-4">
        <div className="group relative rounded-2xl bg-black/[0.04] border border-black/[0.02] p-3 transition-all hover:bg-black/[0.06]">
          <div className={cn(
            "text-[14px] leading-relaxed text-black/70",
            !isExpanded && isLong && "line-clamp-3"
          )}>
            {text}
          </div>
          {isLong && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[11px] font-bold uppercase tracking-wider text-black/40 hover:text-black/60"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
          <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={text} />
          </div>
          <div className="absolute right-3 bottom-2 text-[9px] font-bold text-black/10 uppercase tabular-nums">
            {new Date(message.time.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      <div className="h-6 w-full bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
    </div>
  )
}

function StepsFlow({ parts }: { parts: Part[] }) {
  const [expanded, setExpanded] = useState(false)
  
  const summary = useMemo(() => {
    const tools = parts.filter(p => p.type === "tool") as ToolPart[]
    if (tools.length === 0) return "Thinking"
    if (tools.length === 1) {
      const toolPart = tools[0]
      const name = toolPart.tool
      const args = toolPart.state.input || {}
      
      let detail = ""
      if (name === "bash" || name === "pty") detail = `: ${args.command || ""}`
      else if (name === "read") detail = `: ${args.path || args.filePath || ""}`
      else if (name === "grep") detail = `: ${args.pattern || ""}`
      else if (name === "write") detail = `: ${args.path || args.filePath || ""}`
      else if (name === "glob") detail = `: ${args.pattern || ""}`
      
      return `Thinking + ${name}${detail}`
    }
    return `Thinking + ${tools.length} tools`
  }, [parts])

  return (
    <div className="mb-2 flex flex-col items-start">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex max-w-full items-center gap-2 rounded-lg py-1 text-[12px] font-bold text-black/30 hover:text-black/50 transition-colors uppercase tracking-tight"
      >
        <div className="shrink-0 flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Brain size={14} className="opacity-40" />
        </div>
        <span className="truncate">{summary}</span>
      </button>
      
      {expanded && (
        <div className="mt-1 flex w-full flex-col gap-2 pl-4 border-l border-black/5">
          {parts.map(part => (
            <PartRenderer key={part.id} part={part} isStep />
          ))}
        </div>
      )}
    </div>
  )
}

function PartRenderer({ part, isStep }: { part: Part, isStep?: boolean }) {
  const [expanded, setExpanded] = useState(false)

  if (part.type === "text") {
    return (
      <div className="prose-content text-[15px] leading-[1.6] text-[#1d1a17]">
        <ReactMarkdown
          components={{
            p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
            ul: ({children}) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
            ol: ({children}) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
            code({ className, children, ...props }: { className?: string, children?: React.ReactNode }) {
              const match = /language-(\w+)/.exec(className || "")
              const content = String(children).replace(/\n$/, "")
              if (!className) return <code className="code-inline" {...props}>{children}</code>
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match?.[1] ?? "text"}
                  PreTag="div"
                  className="rounded-xl !my-4 !bg-[#151312]"
                  customStyle={{ fontSize: '13px', padding: '16px' }}
                >
                  {content}
                </SyntaxHighlighter>
              )
            }
          }}
        >
          {part.text}
        </ReactMarkdown>
      </div>
    )
  }

  if (part.type === "reasoning") {
    return (
      <div className="text-[13px] leading-relaxed text-black/30 italic py-1">
        {part.text}
      </div>
    )
  }

  if (part.type === "tool") {
    const status = part.state.status
    const toolName = part.tool
    const args = (part.state.status !== "pending" && part.state.status !== "running" ? part.state.input : {}) as Record<string, string | undefined>
    
    let summaryText = toolName
    if (toolName === "bash" || toolName === "pty") summaryText = `bash: ${args.command || ''}`
    else if (toolName === "read") summaryText = `read: ${args.path || args.filePath || ''}`
    else if (toolName === "grep") summaryText = `grep: ${args.pattern || ''}`
    else if (toolName === "write") summaryText = `write: ${args.path || args.filePath || ''}`
    else if (toolName === "glob") summaryText = `glob: ${args.pattern || ''}`

    return (
      <div className="flex flex-col w-full">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border border-black/[0.03] bg-black/[0.015] px-3 py-1.5 text-left transition-all hover:bg-black/[0.03]",
            isStep ? "text-[12px]" : "text-[13px]"
          )}
        >
          <div className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            status === "completed" ? "bg-emerald-500" : status === "error" ? "bg-red-500" : "bg-blue-400 animate-pulse"
          )} />
          <span className="truncate font-mono text-black/40 flex-1">{summaryText}</span>
          {expanded ? <ChevronDown size={14} className="opacity-20" /> : <ChevronRight size={14} className="opacity-20" />}
        </button>
        {expanded && (
          <div className="mt-1 rounded-xl border border-black/5 bg-[#151312] p-3 font-mono text-[12px] text-[#f6f3ef] overflow-x-auto shadow-inner">
            <ToolOutput part={part} />
          </div>
        )}
      </div>
    )
  }

  if (part.type === "file") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2 shadow-sm w-fit my-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-black/40">
          <ToolIcon size={14} />
        </div>
        <div className="flex flex-col pr-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-black/20">attached file</span>
          <span className="text-[13px] font-medium text-black/60">{part.filename ?? part.url}</span>
        </div>
      </div>
    )
  }

  return null
}

function ToolOutput({ part }: { part: Part }) {
  if (part.type !== "tool") return null
  const state = part.state

  if (state.status === "error") return <div className="text-red-400">{state.error}</div>
  if (state.status === "pending" || state.status === "running") return <div className="text-blue-400 animate-pulse">Running...</div>
  if (state.status !== "completed") return null
  
  const output = state.output
  const toolName = part.tool
  
  if (typeof output === "string") {
    if (toolName === "bash" || toolName === "pty") {
      if (output.split('\n').length > 1 && output.trim().split(/\s+/).length > 2) {
        return <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1">{output.trim().split('\n').map((line, i) => <div key={i} className="truncate">{line}</div>)}</div>
      }
    }
    return <pre className="whitespace-pre-wrap">{output}</pre>
  }
  
  let data: unknown
  let parseError = false
  try {
    data = typeof output === "object" ? output : JSON.parse(output as string)
  } catch {
    parseError = true
  }

  if (parseError) {
    return <pre className="whitespace-pre-wrap">{String(output)}</pre>
  }

  if (Array.isArray(data) && data.length > 0 && (data[0] as { absolute?: string }).absolute) {
    return (
      <div className="grid grid-cols-1 gap-1">
        {(data as { absolute: string, type: string, name: string }[]).map((item) => (
          <div key={item.absolute} className="flex items-center gap-2 text-[#f6f3ef]/80">
            <span className="opacity-40">{item.type === 'directory' ? '📁' : '📄'}</span>
            <span className="truncate">{item.name}</span>
          </div>
        ))}
      </div>
    )
  }
  return <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg border border-black/[0.03] bg-white shadow-sm transition-all text-black/30 hover:text-black/60 hover:border-black/10 hover:bg-black/[0.02]"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  )
}
