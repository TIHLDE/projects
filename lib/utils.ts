import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PROJECT_COLORS = [
  "#4f8ef7",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
]

export const TAG_COLORS: Record<string, string> = {
  design:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  code: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  bug: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  feature:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  docs: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  testing:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  research:
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  devops:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
}

export const AVAILABLE_TAGS = Object.keys(TAG_COLORS)

export const TASK_STATUS_LABELS: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
}

export const TASK_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
] as const

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Lav",
  MEDIUM: "Middels",
  HIGH: "Høy",
  URGENT: "Haster",
}

export function getInitials(name: string | null | undefined, email?: string | null) {
  if (name && name.trim().length > 0) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "??"
}
