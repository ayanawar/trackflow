'use client'
import { useRef } from 'react'
import { startOfWeek, addDays, format, startOfDay } from 'date-fns'
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { computeLayoutEntries, snapToQuarter, formatDurationHM, type LayoutEntry } from './calendarUtils'
import CalendarEntryBlock from './CalendarEntryBlock'
import type { TimeEntry } from '@/types'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface CalendarWeekViewProps {
  entries: TimeEntry[]
  currentDate: Date
  onEditEntry: (entry: TimeEntry) => void
  onCreateEntry: (startTime: Date, endTime: Date) => void
  onReschedule: (entry: TimeEntry, newStart: Date, newEnd: Date) => void
}

interface DraggableBlockProps {
  layoutEntry: LayoutEntry
  onEdit: (entry: TimeEntry) => void
}

function DraggableBlock({ layoutEntry, onEdit }: DraggableBlockProps) {
  const { entry } = layoutEntry
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: { entry, layoutEntry },
    disabled: entry.isRunning,
  })

  return (
    <div ref={setNodeRef} style={{ position: 'absolute', top: `${layoutEntry.topPercent}%`, height: `${layoutEntry.heightPercent}%`, left: `${(layoutEntry.columnIndex / layoutEntry.columnCount) * 100}%`, width: `${(1 / layoutEntry.columnCount) * 100}%` }}>
      <CalendarEntryBlock
        layoutEntry={{ ...layoutEntry, topPercent: 0, heightPercent: 100, columnIndex: 0, columnCount: 1 }}
        onEdit={onEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}

interface DroppableDayColumnProps {
  dayIndex: number
  dayStart: Date
  entries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  onClick: (dayStart: Date, y: number, height: number) => void
}

function DroppableDayColumn({ dayIndex, dayStart, entries, onEdit, onClick }: DroppableDayColumnProps) {
  const { setNodeRef } = useDroppable({ id: `day-${dayIndex}`, data: { dayStart } })
  const colRef = useRef<HTMLDivElement>(null)

  const layoutEntries = computeLayoutEntries(entries, dayStart)

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('[data-entry-id]')) return
    const rect = colRef.current?.getBoundingClientRect()
    if (!rect) return
    onClick(dayStart, e.clientY - rect.top, rect.height)
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        ;(colRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      className="relative border-r cursor-crosshair"
      style={{ borderColor: 'var(--border)', minHeight: '1440px' }}
      onClick={handleClick}
    >
      {layoutEntries.map(le => (
        <DraggableBlock key={le.entry.id} layoutEntry={le} onEdit={onEdit} />
      ))}
    </div>
  )
}

export default function CalendarWeekView({
  entries,
  currentDate,
  onEditEntry,
  onCreateEntry,
  onReschedule,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    if (!over || !active.data.current) return

    const { entry } = active.data.current as { entry: TimeEntry; layoutEntry: LayoutEntry }
    if (entry.isRunning) return

    // Compute pixel-to-minute ratio: 1440px total = 1440 minutes
    const pixelsPerMinute = 1 // 1440px / 1440 min
    const deltaMinutes = Math.round(delta.y / pixelsPerMinute)
    const snappedDelta = Math.round(deltaMinutes / 15) * 15

    const originalStart = new Date(entry.startTime)
    const originalEnd = entry.endTime ? new Date(entry.endTime) : new Date()
    const duration = originalEnd.getTime() - originalStart.getTime()

    const targetDayStart = over.data.current?.dayStart as Date | undefined
    const newStart = targetDayStart
      ? snapToQuarter(new Date(targetDayStart.getTime() + (originalStart.getHours() * 60 + originalStart.getMinutes() + snappedDelta) * 60000))
      : snapToQuarter(new Date(originalStart.getTime() + snappedDelta * 60000))

    const newEnd = new Date(newStart.getTime() + duration)
    onReschedule(entry, newStart, newEnd)
  }

  const handleSlotClick = (dayStart: Date, y: number, height: number) => {
    const minutesIntoDay = Math.floor((y / height) * 1440)
    const snappedMinutes = Math.round(minutesIntoDay / 15) * 15
    const startTime = new Date(dayStart.getTime() + snappedMinutes * 60000)
    const endTime = new Date(startTime.getTime() + 60 * 60000)
    onCreateEntry(startTime, endTime)
  }

  const entriesByDay = days.map(day => {
    const dayStart = startOfDay(day)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1)
    return entries.filter(e => {
      const s = new Date(e.startTime)
      return s >= dayStart && s <= dayEnd
    })
  })

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <DndContext sensors={sensors} modifiers={[restrictToWindowEdges]} onDragEnd={handleDragEnd}>
      {/* Day header row */}
      <div
        className="grid sticky top-0 z-10"
        style={{ gridTemplateColumns: '56px repeat(7, 1fr)', background: 'rgb(var(--bg-secondary))', borderBottom: '1px solid var(--border)' }}
      >
        <div />
        {days.map((day, i) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const isToday = dayStr === todayStr
          return (
            <div
              key={i}
              className="py-2 text-center text-xs font-medium"
              style={{ color: isToday ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))', borderLeft: '1px solid var(--border)' }}
            >
              <span className="block">{DAY_SHORT[i]}</span>
              <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-sm font-semibold mt-0.5 ${isToday ? 'text-white' : ''}`}
                style={isToday ? { background: 'rgb(var(--accent))' } : {}}>
                {format(day, 'd')}
              </span>
            </div>
          )
        })}
      </div>

      {/* Scrollable body */}
      <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {/* On mobile (< sm), only show current day; all 7 columns accessible via horizontal scroll */}
        <div
          className="grid"
          style={{ gridTemplateColumns: '56px repeat(7, minmax(120px, 1fr))', minWidth: '100%' }}
        >
          {/* Time gutter */}
          <div className="relative" style={{ minHeight: '1440px' }}>
            {HOURS.map(h => (
              <div
                key={h}
                className="absolute w-full pr-2 text-right text-[10px]"
                style={{ top: `${(h / 24) * 100}%`, color: 'rgb(var(--text-faint))', transform: 'translateY(-50%)' }}
              >
                {h === 0 ? '' : format(new Date(2000, 0, 1, h), 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => (
            <DroppableDayColumn
              key={i}
              dayIndex={i}
              dayStart={startOfDay(day)}
              entries={entriesByDay[i]}
              onEdit={onEditEntry}
              onClick={handleSlotClick}
            />
          ))}
        </div>
      </div>
    </DndContext>
  )
}
