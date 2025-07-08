import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "card" | "title" | "text" | "button" | "progress" | "stat"
  width?: string | number
  height?: string | number
  className?: string
  animate?: boolean
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className,
  animate = true,
  ...props
}: SkeletonProps) {
  const baseStyles = "rounded-md bg-gradient-to-r from-gray-200 to-gray-100"
  const animationStyles = animate ? "animate-pulse" : ""

  const variants = {
    card: "w-full h-[120px]",
    title: "h-8 w-48",
    text: "h-4 w-full",
    button: "h-10 w-24",
    progress: "h-2 w-full",
    stat: "h-8 w-24"
  }

  const style = {
    width: width,
    height: height
  }

  return (
    <div
      className={cn(baseStyles, variants[variant], animationStyles, className)}
      style={style}
      {...props}
    />
  )
}

interface StatCardSkeletonProps {
  className?: string
}

export function StatCardSkeleton({ className }: StatCardSkeletonProps) {
  return (
    <div className={cn(
      "space-y-2 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100",
      className
    )}>
      <Skeleton variant="stat" />
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" width={80} className="opacity-70" />
    </div>
  )
}

interface ProgressBarSkeletonProps {
  className?: string
}

export function ProgressBarSkeleton({ className }: ProgressBarSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "mt-8 space-y-3 p-4 rounded-xl bg-gray-50/30 border border-gray-100",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={180} className="opacity-70" />
        </div>
        <Skeleton variant="stat" />
      </div>
      <Skeleton variant="progress" />
    </motion.div>
  )
}
