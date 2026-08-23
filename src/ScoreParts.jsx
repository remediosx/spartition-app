import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function ScoreParts({ scoreId, userId }) {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchParts()
  }, [scoreId])

  async function fetchParts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('score_parts')
      .select('id, part_type, original_filename, file_path, preview_path, instrument:instrument_id ( name )')
      .eq('score_id', scoreId)

    if (error) {
      console.error('Errore nel caricamento parti:', error)
      setParts([])
    } else {
      setParts(data)
    }
    setLoading(false)
  }

    function getPreviewUrl(previewPath) {
    if (!previewPath) return null
    const { data } = supabase.storage
      .from('score-previews')
      .getPublicUrl(previewPath)
    return data.publicUrl
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

    async function handleDelete(part) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare "${part.original_filename}"? Questa azione non si può annullare.`
    )
    if (!confirmed) return

    const { error: linkError } = await supabase
      .from('score_parts_bands')
      .delete()
      .eq('score_part_id', part.id)

    if (linkError) {
      alert('Errore nella rimozione dei collegamenti: ' + linkError.message)
      return
    }

    const { error: storageError } = await supabase.storage
      .from('score-parts')
      .remove([part.file_path])

    if (storageError) {
      alert('Errore nella rimozione del file: ' + storageError.message)
      return
    }

    const { error: dbError } = await supabase
      .from('score_parts')
      .delete()
      .eq('id', part.id)

    if (dbError) {
      alert('Errore nella rimozione della parte: ' + dbError.message)
      return
    }

    fetchParts()
  }

  if (loading) return <p>Caricamento parti...</p>
  if (parts.length === 0) return <p>Nessuna parte disponibile per questo brano.</p>

  return (
    <ul>
      {parts.map((p) => (
        <li key={p.id} style={{ marginBottom: '15px' }}>
          {p.preview_path && (
            <div>
              <img
                src={getPreviewUrl(p.preview_path)}
                alt={`Anteprima ${p.original_filename}`}
                style={{ maxWidth: '30%', border: '1px solid #ccc' }}
              />
            </div>
          )}
          [{p.part_type}{p.instrument && ` — ${p.instrument.name}`}] {p.original_filename}{' '}
          <button onClick={() => handleDownload(p.file_path, p.original_filename)}>
            Scarica
          </button>{' '}
          <button onClick={() => handleDelete(p)}>🗑️ Elimina</button>
        </li>
      ))}
    </ul>
  )
}

export default ScoreParts