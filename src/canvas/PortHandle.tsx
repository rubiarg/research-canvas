import { useState } from 'react'
import { Circle } from 'react-konva'
import { useStore } from '@/store/index.ts'

interface PortHandleProps {
  blockId: string
  blockWidth: number
  blockHeight: number
}

export function PortHandle({ blockId, blockWidth, blockHeight }: PortHandleProps) {
  const [hoveredPort, setHoveredPort] = useState<string | null>(null)
  const setConnecting = useStore((s) => s.setConnecting)
  const connectingFrom = useStore((s) => s.ui.connectingFrom)

  const ports = [
    { id: 'top', x: blockWidth / 2, y: 0 },
    { id: 'bottom', x: blockWidth / 2, y: blockHeight },
    { id: 'left', x: 0, y: blockHeight / 2 },
    { id: 'right', x: blockWidth, y: blockHeight / 2 },
  ]

  return (
    <>
      {ports.map((port) => (
        <Circle
          key={port.id}
          x={port.x}
          y={port.y}
          radius={hoveredPort === port.id ? 6 : 4}
          fill={connectingFrom === blockId ? '#f59e0b' : '#6366f1'}
          stroke="white"
          strokeWidth={1.5}
          opacity={hoveredPort === port.id || connectingFrom === blockId ? 1 : 0}
          onMouseEnter={() => setHoveredPort(port.id)}
          onMouseLeave={() => setHoveredPort(null)}
          onClick={(e) => {
            e.cancelBubble = true
            setConnecting(blockId)
          }}
          style={{ cursor: 'crosshair' }}
        />
      ))}
    </>
  )
}
