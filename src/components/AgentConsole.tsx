import React, { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso'
import { Send, User, Bot, Terminal, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import { AgentConsoleAdapter } from '../adapters/AgentConsoleAdapter'
import type { IMessage, IToolCall } from '../interfaces/IAgentConsole'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AgentConsole: React.FC = () => {
  const [messages, setMessages] = useState<IMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const adapterRef = useRef<AgentConsoleAdapter>(new AgentConsoleAdapter())
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  useEffect(() => {
    const init = async () => {
      await adapterRef.current.initialize({})
      const history = await adapterRef.current.getHistory()
      setMessages(history)
    }

    init()

    adapterRef.current.on('message', (msg) => {
      setMessages(prev => [...prev, {
        id: msg.info.id,
        role: msg.info.role,
        content: msg.parts.map((p: any) => p.text).join('\n'),
        timestamp: msg.info.created_at,
        tools: msg.info.tools,
      }])
    })

    return () => adapterRef.current.dispose()
  }, [])

  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: messages.length - 1,
        behavior: 'smooth',
      })
    }
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: IMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    try {
      await adapterRef.current.sendMessage(inputValue)
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4] font-sans">
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          itemContent={(_, message) => (
            <MessageItem key={message.id} message={message} />
          )}
          style={{ height: '100%' }}
        />
      </div>
      
      <div className="p-4 border-t border-[#333] bg-[#252526]">
        <div className="relative flex items-end gap-2 bg-[#3c3c3c] rounded-md p-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none resize-none min-h-[24px] max-h-[200px] py-1 px-2 text-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              inputValue.trim() && !isSending ? "bg-[#0e639c] hover:bg-[#1177bb]" : "text-[#666]"
            )}
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

const MessageItem: React.FC<{ message: IMessage }> = ({ message }) => {
  const isAssistant = message.role === 'assistant'
  
  return (
    <div className={cn(
      "px-6 py-4 flex gap-4 transition-colors",
      isAssistant ? "bg-[#2d2d2d]" : "bg-transparent"
    )}>
      <div className="flex-shrink-0 mt-1">
        {message.role === 'user' ? (
          <div className="w-6 h-6 bg-[#007acc] rounded flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 bg-[#388e3c] rounded flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider opacity-60">
            {message.role}
          </span>
          <span className="text-[10px] opacity-40">
            {format(message.timestamp, 'HH:mm:ss')}
          </span>
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.tools && message.tools.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.tools.map(tool => (
              <ToolLog key={tool.id} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const CodeBlock: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-2 rounded-md overflow-hidden bg-[#0d0d0d] border border-[#333]">
      <div className="flex items-center justify-between px-4 py-1 bg-[#1e1e1e] border-b border-[#333]">
        <span className="text-[10px] uppercase font-bold opacity-60">{language}</span>
        <button 
          onClick={handleCopy}
          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#333] rounded"
        >
          {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '12px',
          backgroundColor: 'transparent',
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
}

const ToolLog: React.FC<{ tool: IToolCall }> = ({ tool }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const getStatusColor = () => {
    switch (tool.status) {
      case 'completed': return 'text-green-500'
      case 'error': return 'text-red-500'
      case 'running': return 'text-blue-500 animate-pulse'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="border border-[#333] rounded bg-[#1a1a1a] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#252526] transition-colors text-left"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Terminal size={14} className={getStatusColor()} />
        <span className="text-xs font-mono flex-1 truncate">
          {tool.name}({JSON.stringify(tool.args).slice(0, 50)}...)
        </span>
        <span className={cn("text-[10px] uppercase font-bold", getStatusColor())}>
          {tool.status}
        </span>
      </button>
      
      {isOpen && (
        <div className="p-3 border-t border-[#333] bg-[#0d0d0d] font-mono text-[11px] overflow-x-auto">
          <div className="mb-2">
            <span className="opacity-40">Arguments:</span>
            <pre className="mt-1 text-[#9cdcfe]">{JSON.stringify(tool.args, null, 2)}</pre>
          </div>
          {tool.result && (
            <div>
              <span className="opacity-40">Result:</span>
              <pre className="mt-1 text-[#ce9178]">{JSON.stringify(tool.result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
