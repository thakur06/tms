export const formatter = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

export const formatDate = (date) => {
  return date.toISOString().slice(0, 10)
}

export const getRangePercent = (start, end, min, max) => {
  const total = max - min || 1
  const left = ((start - min) / total) * 100
  const width = ((end - start) / total) * 100
  return { left, width }
}

