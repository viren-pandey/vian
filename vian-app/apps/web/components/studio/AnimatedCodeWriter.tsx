'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCodeWriterProps {
  code: string           // full code string being written to
  isWriting: boolean     // true while this file is actively streaming
  language: string       // 'typescript' | 'css' | 'json' etc
  filename: string       // shown in breadcrumb
}

export default function AnimatedCodeWriter({
  code,
  isWriting,
  language,
  filename,
}: AnimatedCodeWriterProps) {
  const [displayed, setDisplayed]   = useState('')
  const [charIndex, setCharIndex]   = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevCodeRef  = useRef('')

  // When new code arrives (streaming chunks), animate it character by character
  useEffect(() => {
    if (!isWriting) {
      // Generation done — show full code instantly
      setDisplayed(code)
      return
    }

    // New characters arrived — animate from where we left off
    if (code.length <= charIndex) return

    const timer = setInterval(() => {
      setCharIndex((prev) => {
        const next = prev + 1
        setDisplayed(code.slice(0, next))

        // Auto-scroll to bottom as code is written
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }

        if (next >= code.length) {
          clearInterval(timer)
        }
        return next
      })
    }, 8) // 8ms per character — fast but visible

    return () => clearInterval(timer)
  }, [code, isWriting, charIndex])

  // Reset when file changes
  useEffect(() => {
    if (prevCodeRef.current !== code && code === '') {
      setDisplayed('')
      setCharIndex(0)
    }
    prevCodeRef.current = code
  }, [code])

  return (
    <div className="relative flex flex-col h-full bg-[#0a0a0a] select-none">

      {/* Breadcrumb */}
      <div className="h-6 flex items-center px-4 border-b border-[#1a1a1a]
                      bg-[#111111] flex-shrink-0">
        <span className="text-[10px] font-mono text-[#444]">
          {filename.includes('/')
            ? filename.split('/').map((part, i, arr) => (
                <span key={i}>
                  <span className={i === arr.length - 1 ? 'text-[#888]' : 'text-[#333]'}>
                    {part}
                  </span>
                  {i < arr.length - 1 && (
                    <span className="text-[#2a2a2a] mx-1">›</span>
                  )}
                </span>
              ))
            : <span className="text-[#888]">{filename}</span>
          }
        </span>

        {/* VIAN writing indicator */}
        {isWriting && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-[#3b82f6]">VIAN writing</span>
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#3b82f6]"
                  style={{
                    animation: `bounce 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      {/* Code display area — NOT an input, fully non-editable */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto px-0 py-3 pointer-events-none"
        style={{ userSelect: 'none' }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {displayed.split('\n').map((line, lineIndex, allLines) => {
              const isLastLine = lineIndex === allLines.length - 1
              return (
                <tr key={lineIndex} className="hover:bg-[#111111]/50">
                  {/* Line number */}
                  <td className="text-right pr-4 pl-6 text-[#2a2a2a] text-[12px]
                                  font-mono select-none w-12 align-top
                                  border-r border-[#111111]">
                    {lineIndex + 1}
                  </td>

                  {/* Code line */}
                  <td className="pl-4 pr-4 align-top">
                    <span
                      className="text-[12px] font-mono leading-[1.7] whitespace-pre"
                      dangerouslySetInnerHTML={{
                        __html: syntaxHighlight(line, language),
                      }}
                    />
                    {/* Blinking cursor on the last line while writing */}
                    {isWriting && isLastLine && (
                      <span
                        className="inline-block w-[2px] h-[14px] bg-[#3b82f6]
                                   ml-[1px] align-middle"
                        style={{ animation: 'cursor-blink 1s step-end infinite' }}
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Non-editable overlay — blocks all mouse events */}
      {isWriting && (
        <div
          className="absolute inset-0 z-10 cursor-not-allowed"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          style={{ pointerEvents: 'all' }}
        />
      )}
    </div>
  )
}

// Simple syntax highlighter — returns HTML string with colored spans
function syntaxHighlight(line: string, language: string): string {
  if (language === 'json') {
    return line
      .replace(/(".*?")(\s*:)/g, '<span style="color:#a78bfa">$1</span>$2')
      .replace(/:\s*(".*?")/g, ': <span style="color:#22c55e">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span style="color:#f97316">$1</span>')
      .replace(/:\s*(true|false|null)/g, ': <span style="color:#3b82f6">$1</span>')
  }

  // TypeScript / TSX / CSS
  return line
    // strings
    .replace(/('.*?'|".*?"|`.*?`)/g, '<span style="color:#22c55e">$1</span>')
    // keywords
    .replace(
      /\b(import|export|default|from|const|let|var|function|return|if|else|for|while|class|interface|type|extends|implements|async|await|new|typeof|keyof|in|of|as|declare|enum)\b/g,
      '<span style="color:#3b82f6">$1</span>'
    )
    // JSX tags
    .replace(/(&lt;\/?[A-Za-z][A-Za-z0-9]*)/g, '<span style="color:#3b82f6">$1</span>')
    // JSX attributes
    .replace(/\b([a-zA-Z]+)=/g, '<span style="color:#a78bfa">$1</span>=')
    // component names / types (PascalCase)
    .replace(/\b([A-Z][a-zA-Z0-9]+)\b/g, '<span style="color:#f59e0b">$1</span>')
    // numbers
    .replace(/\b(\d+)\b/g, '<span style="color:#f97316">$1</span>')
    // comments
    .replace(/(\/\/.*$)/g, '<span style="color:#333333">$1</span>')
    // CSS values after colon
    .replace(/:\s*(#[0-9a-fA-F]{3,8}|rgba?\(.*?\)|[\d.]+(?:px|em|rem|%|vh|vw))/g,
      ': <span style="color:#f97316">$1</span>')
}
