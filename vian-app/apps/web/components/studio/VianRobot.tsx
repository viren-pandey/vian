'use client'

interface VianRobotProps {
  isWriting: boolean
}

export default function VianRobot({ isWriting }: VianRobotProps) {
  if (!isWriting) return null

  return (
    <div
      className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1"
      style={{ animation: 'robot-float 2s ease-in-out infinite' }}
    >
      {/* Robot head */}
      <div className="relative">
        {/* Glow behind robot */}
        <div
          className="absolute inset-0 rounded-xl bg-[#3b82f6] blur-md opacity-30"
          style={{ transform: 'scale(1.4)' }}
        />

        {/* Robot body */}
        <div className="relative w-10 h-10 bg-[#111111] border border-[#3b82f6]/50
                        rounded-xl flex items-center justify-center overflow-hidden">
          {/* Screen/face */}
          <div className="w-7 h-6 bg-[#0a0a0a] rounded-md border border-[#1f1f1f]
                          flex items-center justify-center gap-1.5">
            {/* Eyes — blink animation */}
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
              style={{ animation: 'eye-blink 3s ease-in-out infinite' }}
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
              style={{ animation: 'eye-blink 3s ease-in-out infinite 0.1s' }}
            />
          </div>

          {/* Antenna */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
            <div className="w-px h-2 bg-[#3b82f6]/50" />
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"
              style={{ animation: 'antenna-pulse 1s ease-in-out infinite' }}
            />
          </div>
        </div>
      </div>

      {/* "Writing..." label */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-full
                      px-2 py-0.5 flex items-center gap-1">
        <span className="text-[9px] font-mono text-[#3b82f6]">writing</span>
        <span className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-0.5 h-0.5 rounded-full bg-[#3b82f6]"
              style={{
                animation: 'bounce 0.8s ease-in-out infinite',
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  )
}
