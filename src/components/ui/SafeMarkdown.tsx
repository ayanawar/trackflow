import React from 'react'

interface Props { text: string }

export default function SafeMarkdown({ text }: Props) {
  const parts = text.split(/(\*\*.*?\*\*|\n)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}
