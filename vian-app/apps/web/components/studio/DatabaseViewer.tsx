'use client'

import { useState } from 'react'
import { Database, Table, ChevronRight, ChevronDown } from 'lucide-react'

interface Table {
  name: string
  fields: Array<{
    name: string
    type: string
    required: boolean
    relation?: string
  }>
}

interface DatabaseViewerProps {
  schema?: Table[]
}

export default function DatabaseViewer({ schema }: DatabaseViewerProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  // Default schema if none provided
  const defaultSchema: Table[] = [
    {
      name: 'User',
      fields: [
        { name: 'id', type: 'String', required: true },
        { name: 'email', type: 'String', required: true },
        { name: 'name', type: 'String', required: false },
        { name: 'createdAt', type: 'DateTime', required: true },
        { name: 'posts', type: 'Post[]', required: false, relation: 'Post' },
      ],
    },
    {
      name: 'Post',
      fields: [
        { name: 'id', type: 'String', required: true },
        { name: 'title', type: 'String', required: true },
        { name: 'content', type: 'String', required: false },
        { name: 'published', type: 'Boolean', required: true },
        { name: 'authorId', type: 'String', required: true },
        { name: 'author', type: 'User', required: true, relation: 'User' },
        { name: 'createdAt', type: 'DateTime', required: true },
      ],
    },
  ]

  const tables = schema ?? defaultSchema

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables)
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName)
    } else {
      newExpanded.add(tableName)
    }
    setExpandedTables(newExpanded)
  }

  const getTypeColor = (type: string) => {
    if (type.includes('String')) return 'text-[#22c55e]'
    if (type.includes('Int') || type.includes('Float')) return 'text-[#3b82f6]'
    if (type.includes('Boolean')) return 'text-[#f59e0b]'
    if (type.includes('DateTime')) return 'text-[#a78bfa]'
    if (type.includes('[]')) return 'text-[#ec4899]'
    return 'text-[#888]'
  }

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 md:px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
        <Database size={16} className="text-[#3b82f6]" />
        <h2 className="text-heading text-[#f0f0f0]">Database Schema</h2>
        <span className="ml-auto text-xs text-[#555] font-mono">{tables.length} tables</span>
      </div>

      {/* Schema content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
        {tables.map((table) => {
          const isExpanded = expandedTables.has(table.name)
          return (
            <div
              key={table.name}
              className="bg-[#141414] border border-[#1f1f1f] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-colors"
            >
              {/* Table header */}
              <button
                onClick={() => toggleTable(table.name)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-[#555]" />
                ) : (
                  <ChevronRight size={14} className="text-[#555]" />
                )}
                <Table size={14} className="text-[#3b82f6]" />
                <span className="font-medium text-sm text-[#f0f0f0]">{table.name}</span>
                <span className="ml-auto text-xs text-[#555] font-mono">
                  {table.fields.length} fields
                </span>
              </button>

              {/* Fields list */}
              {isExpanded && (
                <div className="border-t border-[#1a1a1a] bg-[#0d0d0d]">
                  {table.fields.map((field, idx) => (
                    <div
                      key={field.name}
                      className={`flex items-center gap-3 px-4 py-2.5 ${
                        idx !== table.fields.length - 1 ? 'border-b border-[#1a1a1a]' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-[#f0f0f0]">{field.name}</span>
                          {field.required && (
                            <span className="text-[10px] bg-[#ef4444]/10 text-[#ef4444] px-1.5 py-0.5 rounded">
                              required
                            </span>
                          )}
                          {field.relation && (
                            <span className="text-[10px] bg-[#3b82f6]/10 text-[#3b82f6] px-1.5 py-0.5 rounded">
                              → {field.relation}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-xs font-mono ${getTypeColor(field.type)}`}>
                        {field.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {tables.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <Database size={48} className="text-[#2a2a2a]" />
          <p className="text-sm text-[#555]">No database schema detected</p>
          <p className="text-xs text-[#444] max-w-xs">
            Generate an app with a database to see the schema here
          </p>
        </div>
      )}
    </div>
  )
}
