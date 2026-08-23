import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function MyMediaList({ userId }) {
  const [mediaItems, setMediaItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyMedia()
  }, [userId])

  async function fetchMyMedia() {
    if (!userId) {
      setMediaItems([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: perms } = await supabase
      .from('user_band_permissions')
      .select('band_id')
      .eq('user_id', userId)

    const bandIds = (perms || []).map((p) => p.band_id)

    if (bandIds.length === 0) {
      setMediaItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('media_items')
      .select(`
        id,
        media_type,
        recording_year,
        notes,
        original_filename,
        file_path,
        performers ( name ),
        scores ( title ),
        bands ( name )
      `)
      .in('band_id', bandIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore nel caricamento media:', error)
      setMediaItems([])
    } else {
      setMediaItems(data)
    }
    setLoading(false)
  }

  async function handleDownload(filePath, originalFilename) {
    const { data, error } = await supabase.storage
      .from('media-items')
      .download(filePath)

    if (error) {
      alert('Errore nel download: ' + error.message)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = originalFilename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p>Caricamento media...</p>
  if (mediaItems.length === 0) return <p>Non hai ancora media disponibili per le tue band.</p>

  return (
    <ul>
      {mediaItems.map((m) => (
        <li key={m.id}>
          [{m.media_type}] {m.original_filename}
          {m.scores && ` — Brano: ${m.scores.title}`}
          {m.performers && ` — Performer: ${m.performers.name}`}
          {m.recording_year && ` — Anno: ${m.recording_year}`}
          {m.bands && ` — Band: ${m.bands.name}`}
          {m.notes && ` — Note: ${m.notes}`}{' '}
          <button onClick={() => handleDownload(m.file_path, m.original_filename)}>
            Scarica
          </button>
        </li>
      ))}
    </ul>
  )
}

export default MyMediaList