'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Send, Sparkles, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/useAuth'
import { useProperty } from '@/lib/useProperty'
import {
  subscribeWarrantyAssets,
  subscribeSnags,
  subscribeProperty,
  type WarrantyAsset,
  type Snag,
  type Property,
} from '@/lib/firestore'
import { getWarrantyStatus, getDaysUntil } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

const QUICK_CHIPS = [
  { label: '🛡️ Warranty status', query: 'Which warranties are expiring soon?' },
  { label: '🔨 Open snags', query: 'Show me all open snags' },
  { label: '🏠 My property', query: 'Tell me about my property' },
  { label: '❄️ AC details', query: 'What is my AC model and warranty?' },
  { label: '📊 Summary', query: 'Give me a full home summary' },
]

function generateReply(
  query: string,
  assets: WarrantyAsset[],
  snags: Snag[],
  property: Property | null
): string {
  const q = query.toLowerCase()

  // Property queries
  if (q.includes('property') || q.includes('home') || q.includes('house') || q.includes('flat') || q.includes('apartment')) {
    if (!property) return "I don't see a property set up yet. Head to Onboarding to add your home details."
    return `🏠 **${property.name}**\n\nUnit: ${property.unit || 'N/A'}\nLocation: ${property.location || 'N/A'}\nType: ${property.floorPlanType || 'N/A'}\nArea: ${property.area > 0 ? `${property.area} sq ft` : 'N/A'}\nGmail sync: ${property.gmailLinked ? '✅ Connected' : '❌ Not connected'}`
  }

  // Summary query
  if (q.includes('summary') || q.includes('overview') || q.includes('everything') || q.includes('all')) {
    const expiringCount = assets.filter((a) => getWarrantyStatus(a.warrantyExpiry) === 'expiring').length
    const openSnags = snags.filter((s) => s.status === 'open').length
    const propName = property?.name ?? 'your home'
    return `📋 **${propName} Summary**\n\n🛡️ Warranties: ${assets.length} total, ${expiringCount} expiring soon\n🔨 Snags: ${openSnags} open, ${snags.length} total\n📦 Assets tracked: ${assets.length}\n${property ? `\n📍 ${property.unit} · ${property.location}` : ''}`
  }

  // Warranty queries
  if (q.includes('warrant') || q.includes('expir') || q.includes('shield')) {
    const expiring = assets.filter((a) => getWarrantyStatus(a.warrantyExpiry) === 'expiring')
    const expired = assets.filter((a) => getWarrantyStatus(a.warrantyExpiry) === 'expired')
    const active = assets.filter((a) => getWarrantyStatus(a.warrantyExpiry) === 'active')

    if (assets.length === 0)
      return "You don't have any warranty assets tracked yet. Head to the Warranty Center to add your first asset."

    const lines: string[] = [`You have ${assets.length} asset${assets.length !== 1 ? 's' : ''} tracked:`]
    if (expiring.length > 0)
      lines.push(`\n⚠️ Expiring soon (${expiring.length}): ${expiring.map((a) => `${a.name} (${getDaysUntil(a.warrantyExpiry)}d)`).join(', ')}`)
    if (expired.length > 0)
      lines.push(`\n🔴 Expired (${expired.length}): ${expired.map((a) => a.name).join(', ')}`)
    if (active.length > 0)
      lines.push(`\n✅ Active (${active.length}): ${active.slice(0, 3).map((a) => a.name).join(', ')}${active.length > 3 ? ` +${active.length - 3} more` : ''}`)
    return lines.join('')
  }

  // Snag queries
  if (q.includes('snag') || q.includes('issue') || q.includes('defect') || q.includes('punch')) {
    const open = snags.filter((s) => s.status === 'open')
    const inProgress = snags.filter((s) => s.status === 'in-progress')
    const fixed = snags.filter((s) => s.status === 'fixed')

    if (snags.length === 0)
      return "Great news — no snags have been logged yet! Your home is all clear."

    const lines: string[] = [`You have ${snags.length} snag${snags.length !== 1 ? 's' : ''} on record:`]
    if (open.length > 0)
      lines.push(`\n🔴 Open (${open.length}): ${open.map((s) => `${s.title} (${s.location})`).join('; ')}`)
    if (inProgress.length > 0)
      lines.push(`\n🟡 In Progress (${inProgress.length}): ${inProgress.map((s) => s.title).join(', ')}`)
    if (fixed.length > 0)
      lines.push(`\n✅ Fixed: ${fixed.length} resolved`)
    return lines.join('')
  }

  // AC-specific queries
  if (q.includes('ac') || q.includes('air condition') || q.includes('daikin') || q.includes('blue star')) {
    const acAssets = assets.filter((a) =>
      a.name.toLowerCase().includes('ac') ||
      a.name.toLowerCase().includes('air') ||
      a.zone.toLowerCase().includes('ac')
    )
    if (acAssets.length === 0)
      return "I couldn't find any AC units in your Warranty Center. Add one to start tracking it."
    return acAssets.map((a) =>
      `${a.icon} ${a.name}\nBrand: ${a.brand || 'N/A'} · Model: ${a.model || 'N/A'}\nSerial: ${a.serialNumber || 'N/A'}\nWarranty: ${getWarrantyStatus(a.warrantyExpiry).toUpperCase()} · Expires ${a.warrantyExpiry || 'N/A'}`
    ).join('\n\n')
  }

  // Paint / interior queries
  if (q.includes('paint') || q.includes('colour') || q.includes('color') || q.includes('wall') || q.includes('finish')) {
    return "Paint codes and finish specs are stored in your Home Vault under 🎨 Interior Specs. Head to the Vault tab and open that category to find the detailed spec sheet."
  }

  // Asset count / summary
  if (q.includes('asset') || q.includes('how many') || q.includes('total') || q.includes('list')) {
    if (assets.length === 0)
      return "No assets tracked yet. Add your first one in the Warranty Center."
    const zones = Array.from(new Set(assets.map((a) => a.zone)))
    return `Your Passport contains ${assets.length} asset${assets.length !== 1 ? 's' : ''} across ${zones.length} zone${zones.length !== 1 ? 's' : ''}:\n\n${assets.map((a) => `${a.icon} ${a.name} · ${a.zone}`).join('\n')}`
  }

  // Fallback
  return `I searched your Digital Passport but couldn't find a specific match for "${query}". Try asking about warranties, snags, paint codes, your property details, or specific appliances. You can also browse the Vault or Warranty Center directly.`
}

export default function AssistantPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: "Hi! I'm your Digital Passport AI. Ask me anything about your home — warranties, open snags, appliance specs, property details, and more.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [listening, setListening] = useState(false)
  const [assets, setAssets] = useState<WarrantyAsset[]>([])
  const [snags, setSnags] = useState<Snag[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const { activePropertyId } = useProperty()
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    if (!user) return
    const u1 = subscribeWarrantyAssets(user.uid, setAssets, activePropertyId)
    const u2 = subscribeSnags(user.uid, setSnags, activePropertyId)
    const u3 = subscribeProperty(user.uid, setProperty, activePropertyId)
    return () => { u1(); u2(); u3() }
  }, [user, activePropertyId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || thinking) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setThinking(true)

    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500))

    const reply = generateReply(text, assets, snags, property)
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: reply, timestamp: new Date() }
    setMessages((prev) => [...prev, aiMsg])
    setThinking(false)
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new SR()
    r.lang = 'en-IN'
    r.interimResults = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    r.onresult = (e: any) => {
      const transcript: string = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) sendMessage(transcript)
    }
    r.onend = () => setListening(false)
    r.start()
    recognitionRef.current = r
    setListening(true)
  }

  function clearChat() {
    setMessages([{
      id: '0',
      role: 'assistant',
      text: "Hi! I'm your Digital Passport AI. Ask me anything about your home — warranties, open snags, appliance specs, property details, and more.",
      timestamp: new Date(),
    }])
  }

  return (
    <div className="min-h-dvh bg-vault-bg flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-gradient-to-b from-vault-surface to-vault-bg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
              <Sparkles size={18} className="text-gold-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Assistant</h1>
              <p className="text-xs text-vault-text-muted">
                {property ? `Knows your ${property.name}` : 'Powered by your Passport data'}
              </p>
            </div>
          </div>
          <button onClick={clearChat} className="w-9 h-9 rounded-xl glass flex items-center justify-center" title="Clear chat">
            <X size={16} className="text-vault-text-muted" />
          </button>
        </div>

        {/* Quick chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.query)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full glass gold-border text-xs font-semibold text-vault-text hover:border-gold-500 hover:text-gold-500 transition-all"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-36">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Sparkles size={12} className="text-gold-500" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-gold-500 text-charcoal-300 font-medium rounded-br-sm'
                  : 'card text-vault-text rounded-bl-sm'
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <Sparkles size={12} className="text-gold-500" />
            </div>
            <div className="card rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="text-gold-500 animate-spin" />
              <span className="text-sm text-vault-text-muted">Searching your Passport…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="fixed inset-x-0 bottom-[72px] bg-vault-bg/95 backdrop-blur-md border-t border-vault-border px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
              listening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'glass gold-border text-gold-500 hover:bg-gold-500/10'
            )}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            className="flex-1 px-4 py-3 text-sm rounded-2xl"
            placeholder="Ask anything about your home…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="w-11 h-11 rounded-xl bg-gold-gradient text-charcoal-300 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:shadow-gold-glow transition-all"
          >
            <Send size={17} />
          </button>
        </div>
        {listening && (
          <p className="text-center text-xs text-red-400 font-semibold mt-2 animate-pulse">🎤 Listening… speak now</p>
        )}
      </div>
    </div>
  )
}
