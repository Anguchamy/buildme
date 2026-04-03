import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { usePostsQuery, useSchedulePostMutation } from '@/hooks/usePosts'
import { getPlatformColor } from '@/utils/helpers'
import { Platform, Post } from '@/types'
import { useState } from 'react'
import PostCard from '@/components/post/PostCard'
import Modal from '@/components/common/Modal'

export default function ContentCalendar() {
  const { data: posts = [] } = usePostsQuery()
  const scheduleMutation = useSchedulePostMutation()
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const events = posts
    .filter((p) => p.scheduledAt)
    .map((p) => ({
      id: String(p.id),
      title: p.caption?.slice(0, 40) ?? 'No caption',
      start: p.scheduledAt!,
      backgroundColor: getPlatformColor((p.platforms[0] as Platform) ?? 'INSTAGRAM'),
      borderColor: 'transparent',
      extendedProps: { post: p },
    }))

  const handleEventDrop = (info: { event: { id: string; start: Date | null } }) => {
    if (!info.event.start) return
    scheduleMutation.mutate({
      postId: Number(info.event.id),
      data: { scheduledAt: info.event.start.toISOString() },
    })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Calendar</h1>
        <p className="text-gray-400 text-sm mt-1">Drag posts to reschedule. Click to view details.</p>
      </div>

      <div className="card overflow-hidden p-0">
        <style>{`
          /* ── FullCalendar base ── */
          .fc {
            --fc-border-color: #e5e7eb;
            --fc-event-bg-color: #6366f1;
            --fc-event-border-color: transparent;
            --fc-today-bg-color: #eef2ff;
            --fc-page-bg-color: transparent;
            --fc-neutral-bg-color: transparent;
            font-size: 0.875rem;
          }

          /* ── Dark mode overrides ── */
          .dark .fc {
            --fc-border-color: rgba(255,255,255,0.06);
            --fc-today-bg-color: rgba(99,102,241,0.08);
            color: #e5e7eb;
          }

          /* ── Toolbar ── */
          .fc .fc-toolbar { padding: 1rem 1.25rem; margin: 0; }
          .fc .fc-toolbar-title { font-size: 1rem !important; font-weight: 600; color: #111827; }
          .dark .fc .fc-toolbar-title { color: #f9fafb; }

          /* ── Nav buttons ── */
          .fc .fc-button-primary {
            background: #f3f4f6 !important;
            border-color: #e5e7eb !important;
            color: #374151 !important;
            font-size: 0.8rem !important;
            font-weight: 500 !important;
            padding: 0.3rem 0.7rem !important;
            border-radius: 0.5rem !important;
            box-shadow: none !important;
            text-transform: capitalize !important;
          }
          .fc .fc-button-primary:hover {
            background: #e5e7eb !important;
            border-color: #d1d5db !important;
            color: #111827 !important;
          }
          .fc .fc-button-primary:not(:disabled):active,
          .fc .fc-button-primary.fc-button-active {
            background: #6366f1 !important;
            border-color: #6366f1 !important;
            color: #fff !important;
          }
          .dark .fc .fc-button-primary {
            background: rgba(255,255,255,0.06) !important;
            border-color: rgba(255,255,255,0.08) !important;
            color: #d1d5db !important;
          }
          .dark .fc .fc-button-primary:hover {
            background: rgba(255,255,255,0.1) !important;
            color: #f9fafb !important;
          }
          .dark .fc .fc-button-primary:not(:disabled):active,
          .dark .fc .fc-button-primary.fc-button-active {
            background: #6366f1 !important;
            border-color: #6366f1 !important;
            color: #fff !important;
          }

          /* ── Column / row borders ── */
          .fc-theme-standard td, .fc-theme-standard th { border-color: var(--fc-border-color); }
          .fc-theme-standard .fc-scrollgrid { border-color: var(--fc-border-color); }

          /* ── Day header row ── */
          .fc .fc-col-header-cell { background: #f9fafb; padding: 0.4rem 0; }
          .fc .fc-col-header-cell-cushion { color: #6b7280; font-weight: 600; font-size: 0.75rem; text-decoration: none; text-transform: uppercase; letter-spacing: 0.04em; }
          .dark .fc .fc-col-header-cell { background: rgba(255,255,255,0.02); }
          .dark .fc .fc-col-header-cell-cushion { color: #6b7280; }

          /* ── Day cells ── */
          .fc .fc-daygrid-day { background: transparent; }
          .fc .fc-daygrid-day:hover { background: rgba(99,102,241,0.04); }
          .fc .fc-daygrid-day-number { color: #6b7280; font-size: 0.8rem; padding: 0.4rem 0.6rem; text-decoration: none; }
          .dark .fc .fc-daygrid-day-number { color: #6b7280; }

          /* ── Today ── */
          .fc .fc-day-today { background: var(--fc-today-bg-color) !important; }
          .fc .fc-day-today .fc-daygrid-day-number { color: #6366f1 !important; font-weight: 700; }

          /* ── Other month days ── */
          .fc .fc-day-other .fc-daygrid-day-number { color: #d1d5db; }
          .dark .fc .fc-day-other .fc-daygrid-day-number { color: #374151; }
          .fc .fc-day-other { background: rgba(0,0,0,0.01); }
          .dark .fc .fc-day-other { background: rgba(0,0,0,0.15); }

          /* ── Events ── */
          .fc .fc-event {
            border-radius: 5px;
            font-size: 0.72rem;
            font-weight: 500;
            padding: 1px 5px;
            cursor: pointer;
            border: none !important;
          }
          .fc .fc-event:hover { filter: brightness(1.1); }
          .fc .fc-event-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

          /* ── List view ── */
          .fc .fc-list-event:hover td { background: rgba(99,102,241,0.06); }
          .dark .fc .fc-list-event:hover td { background: rgba(99,102,241,0.1); }
          .fc .fc-list-day-cushion { background: #f3f4f6; }
          .dark .fc .fc-list-day-cushion { background: rgba(255,255,255,0.04); }
          .fc .fc-list-day-text, .fc .fc-list-day-side-text { color: #374151; text-decoration: none; font-weight: 600; }
          .dark .fc .fc-list-day-text, .dark .fc .fc-list-day-side-text { color: #d1d5db; }
          .fc .fc-list-empty { background: transparent; color: #9ca3af; }
          .fc .fc-list-event-time { color: #6b7280; }
          .dark .fc .fc-list-event td { border-color: rgba(255,255,255,0.05); color: #d1d5db; }

          /* ── Time grid ── */
          .fc .fc-timegrid-slot { height: 2.5rem; }
          .fc .fc-timegrid-axis { color: #9ca3af; font-size: 0.7rem; }
          .dark .fc .fc-timegrid-slot { border-color: rgba(255,255,255,0.05); }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          events={events}
          editable={true}
          droppable={true}
          eventDrop={handleEventDrop}
          eventClick={(info) => setSelectedPost(info.event.extendedProps.post as Post)}
          height="650px"
        />
      </div>

      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} title="Post Details" size="md">
        {selectedPost && <PostCard post={selectedPost} />}
      </Modal>
    </div>
  )
}
