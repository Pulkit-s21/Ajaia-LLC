import React from "react"

interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  color?: "primary" | "secondary" | "white" | "dark"
  className?: string
}

const Loader: React.FC<LoaderProps> = ({
  size = "md",
  color = "primary",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4",
  }

  const colorClasses = {
    primary: "border-blue-600 border-t-transparent",
    secondary: "border-purple-600 border-t-transparent",
    white: "border-white border-t-transparent",
    dark: "border-gray-900 border-t-transparent dark:border-gray-100",
  }

  return (
    <div
      role="status"
      aria-label="loading"
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default Loader
