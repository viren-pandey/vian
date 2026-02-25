export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen flex flex-col bg-base overflow-hidden">{children}</div>
}
