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

      <div className="card overflow-hidden">
        <style>{`
          .fc { --fc-border-color: rgba(255,255,255,0.05); --fc-event-bg-color: #5c6ef5; color: #e5e7eb; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.05); }
          .fc-toolbar-title { font-size: 1rem !important; font-weight: 600; }
          .fc-button-primary { background: #22222f !important; border-color: rgba(255,255,255,0.1) !important; }
          .fc-button-primary:hover { background: #2c2c3c !important; }
          .fc-button-active { background: #5c6ef5 !important; border-color: #5c6ef5 !important; }
          .fc-event { border-radius: 4px; font-size: 0.75rem; }
          .fc-day-today { background: rgba(92,110,245,0.05) !important; }
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
          height="600px"
        />
      </div>

      <Modal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} title="Post Details" size="md">
        {selectedPost && <PostCard post={selectedPost} />}
      </Modal>
    </div>
  )
}
