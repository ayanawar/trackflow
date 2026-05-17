import { roundToNearestMinutes, addMinutes, differenceInMinutes } from 'date-fns'
import type { TimeEntry } from '@/types'

export interface LayoutEntry {
  entry: TimeEntry
  topPercent: number
  heightPercent: number
  columnIndex: number
  columnCount: number
}

const TOTAL_MINUTES = 1440
const MIN_MINUTES = 15

export function computeLayoutEntries(entries: TimeEntry[], dayStart: Date): LayoutEntry[] {
  if (entries.length === 0) return []

  const sorted = [...entries].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Build clusters of overlapping entries
  const clusters: TimeEntry[][] = []
  let currentCluster: TimeEntry[] = []
  let clusterMaxEnd = 0

  for (const entry of sorted) {
    const start = new Date(entry.startTime).getTime()
    const end = entry.endTime ? new Date(entry.endTime).getTime() : Date.now()

    if (currentCluster.length === 0 || start < clusterMaxEnd) {
      currentCluster.push(entry)
      clusterMaxEnd = Math.max(clusterMaxEnd, end)
    } else {
      clusters.push(currentCluster)
      currentCluster = [entry]
      clusterMaxEnd = end
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster)

  const result: LayoutEntry[] = []

  for (const cluster of clusters) {
    const columnCount = cluster.length
    cluster.forEach((entry, columnIndex) => {
      const startMin = Math.max(0, differenceInMinutes(new Date(entry.startTime), dayStart))
      const endTime = entry.endTime ? new Date(entry.endTime) : new Date()
      const rawDuration = differenceInMinutes(endTime, new Date(entry.startTime))
      const durationMin = Math.max(MIN_MINUTES, rawDuration)

      const topPercent = (startMin / TOTAL_MINUTES) * 100
      const heightPercent = (durationMin / TOTAL_MINUTES) * 100

      result.push({ entry, topPercent, heightPercent, columnIndex, columnCount })
    })
  }

  return result
}

export function snapToQuarter(date: Date): Date {
  return roundToNearestMinutes(date, { nearestTo: 15 })
}

export function computeTimeOffset(original: Date, deltaMinutes: number): Date {
  return addMinutes(original, deltaMinutes)
}

export function formatDurationHM(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}
