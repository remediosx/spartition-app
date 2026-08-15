import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function MediaList() {
  const [mediaItems, setMediaItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMedia()
  }, [])

  async function fetchMedia() {
    setLoading(true)
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

  return (
    <div>
      <button onClick={fetchMedia}>🔄 Aggiorna</button>
      {loading && <p>Caricamento media...</p>}
      {!loading && mediaItems.length === 0 && <p>Nessun media caricato.</p>}
      {!loading && mediaItems.length > 0 && (
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
      )}
    </div>
  )
}

export default MediaList