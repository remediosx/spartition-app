import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function ScoreParts({ scoreId }) {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParts()
  }, [scoreId])

  async function fetchParts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('score_parts')
      .select('id, part_type, original_filename, file_path, instrument:instrument_id ( name )')
      .eq('score_id', scoreId)

    if (error) {
      console.error('Errore nel caricamento parti:', error)
      setParts([])
    } else {
      setParts(data)
    }
    setLoading(false)
  }

  async function handleDownload(filePath, originalFilename) {
    const { data, error } = await supabase.storage
      .from('score-parts')
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

  if (loading) return <p>Caricamento parti...</p>
  if (parts.length === 0) return <p>Nessuna parte disponibile per questo brano.</p>

  return (
    <ul>
      {parts.map((p) => (
        <li key={p.id}>
          [{p.part_type}{p.instrument && ` — ${p.instrument.name}`}] {p.original_filename}{' '}
          <button onClick={() => handleDownload(p.file_path, p.original_filename)}>
            Scarica
          </button>
        </li>
      ))}
    </ul>
  )
}

export default ScoreParts