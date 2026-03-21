import { format } from 'date-fns'

interface Props {
  value?: Date
  onChange: (date: Date | undefined) => void
}

export default function SchedulePicker({ value, onChange }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!val) {
      onChange(undefined)
      return
    }
    onChange(new Date(val))
  }

  const formatted = value
    ? format(value, "yyyy-MM-dd'T'HH:mm")
    : ''

  return (
    <div className="space-y-1.5">
      <label className="label">Schedule Date & Time</label>
      <input
        type="datetime-local"
        value={formatted}
        onChange={handleChange}
        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        className="input"
      />
    </div>
  )
}
