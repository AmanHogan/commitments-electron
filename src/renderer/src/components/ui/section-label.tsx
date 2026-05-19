type SectionLabelProps = {
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function SectionLabel({ children, size = "md", className = "" }: SectionLabelProps) {
  if (size === "lg") {
    return <h1 className={`mt-2 mb-4 text-3xl font-bold tracking-tight ${className}`}>{children}</h1>
  } else if (size === "sm") {
    return <h3 className={`mt-2 mb-2 text-lg font-bold tracking-tight ${className}`}>{children}</h3>
  } else return <h2 className={`mt-2 mb-2 text-2xl font-bold tracking-tight ${className}`}>{children}</h2>
}
