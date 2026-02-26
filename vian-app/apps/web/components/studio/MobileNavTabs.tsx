'use client'

import { MessageSquare, Code2, Eye } from 'lucide-react'

interface MobileNavTabsProps {
  activeTab: 'chat' | 'code' | 'preview'
  onTabChange: (tab: 'chat' | 'code' | 'preview') => void
}

export default function MobileNavTabs({ activeTab, onTabChange }: MobileNavTabsProps) {
  const tabs = [
    { id: 'chat' as const, label: 'CHAT', icon: MessageSquare },
    { id: 'code' as const, label: 'CODE', icon: Code2 },
    { id: 'preview' as const, label: 'PREVIEW', icon: Eye },
  ]

  return (
    <div className="md:hidden flex border-b border-[#1a1a1a] bg-[#111111]">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 border-b-2 transition-colors ${
              isActive
                ? 'text-[#3b82f6] border-[#3b82f6]'
                : 'text-[#555555] border-transparent hover:text-[#888888]'
            }`}
          >
            <Icon size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
