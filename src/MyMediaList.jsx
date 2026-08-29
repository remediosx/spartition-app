import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'

function MyMediaList({ userId }) {
  const [myBands, setMyBands] = useState([])
  const [mediaItems, setMediaItems] = useState([])
  const [loadingBands, setLoadingBands] = useState(true)
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBandId = searchParams.get('band')

  useEffect(() => {
    fetchMyBands()
  }, [userId])

  useEffect(() => {
    if (selectedBandId) {
      fetchMediaForBand(selectedBandId)
    }
  }, [selectedBandId])

  async function fetchMyBands() {
    if (!userId) {
      setMyBands([])
      setLoadingBands(false)
      return
    }
    setLoadingBands(true)
    const { data: perms } = await supabase
      .from('user_band_permissions')
      .select('band_id, bands ( id, name )')
      .eq('user_id', userId)

    const bands = (perms || []).map((p) => p.bands).filter(Boolean)
    setMyBands(bands)
    setLoadingBands(false)
  }

  async function fetchMediaForBand(bandId) {
    setLoadingMedia(true)
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
        scores ( title )
      `)
      .eq('band_id', bandId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore nel caricamento media:', error)
      setMediaItems([])
    } else {
      setMediaItems(data)
    }
    setLoadingMedia(false)
  }

  function selectBand(bandId) {
    setSearchParams({ band: bandId })
  }

  function backToBands() {
    setSearchParams({})
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

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare "${item.original_filename}"? Questa azione non si può annullare.`
    )
    if (!confirmed) return

    const { error: storageError } = await supabase.storage
      .from('media-items')
      .remove([item.file_path])

    if (storageError) {
      alert('Errore nella rimozione del file: ' + storageError.message)
      return
    }

    const { error: dbError } = await supabase
      .from('media_items')
      .delete()
      .eq('id', item.id)

    if (dbError) {
      alert('Errore nella rimozione: ' + dbError.message)
      return
    }

    fetchMediaForBand(selectedBandId)
  }

  const currentBand = myBands.find((b) => b.id === Number(selectedBandId))

  if (loadingBands) return <p>Caricamento...</p>

  return (
    <div>
      {!selectedBandId && (
        <>
          <p>Scegli una band per vedere i suoi media:</p>
          {myBands.length === 0 && (
            <p>Non fai ancora parte di nessuna band. Vai su <Link to="/my-bands">Le mie Band</Link> per crearne una.</p>
          )}
          <ul>
            {myBands.map((b) => (
              <li key={b.id}>
                <button onClick={() => selectBand(b.id)}>{b.name}</button>
              </li>
            ))}
          </ul>
        </>
      )}

      {selectedBandId && (
        <>
          <button onClick={backToBands}>← Torna alle band</button>
          <h3>
            {currentBand ? currentBand.name : 'Band'}{' '}
            <button onClick={() => fetchMediaForBand(selectedBandId)}>🔄 Aggiorna</button>
          </h3>

          {loadingMedia && <p>Caricamento media...</p>}
          {!loadingMedia && mediaItems.length === 0 && <p>Nessun media disponibile per questa band.</p>}
          {!loadingMedia && mediaItems.length > 0 && (
            <ul>
              {mediaItems.map((m) => (
                <li key={m.id}>
                  [{m.media_type}] {m.original_filename}
                  {m.scores && ` — Brano: ${m.scores.title}`}
                  {m.performers && ` — Performer: ${m.performers.name}`}
                  {m.recording_year && ` — Anno: ${m.recording_year}`}
                  {m.notes && ` — Note: ${m.notes}`}{' '}
                  <button onClick={() => handleDownload(m.file_path, m.original_filename)}>
                    Scarica
                  </button>{' '}
                  <button onClick={() => handleDelete(m)}>🗑️ Elimina</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

export default MyMediaList