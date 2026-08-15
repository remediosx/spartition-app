import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

async function calculateFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function UploadMedia({ userId }) {
  const [scores, setScores] = useState([])
  const [bands, setBands] = useState([])
  const [performers, setPerformers] = useState([])
  const [selectedScore, setSelectedScore] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [selectedPerformer, setSelectedPerformer] = useState('')
  const [newPerformerName, setNewPerformerName] = useState('')
  const [recordingYear, setRecordingYear] = useState('')
  const [mediaType, setMediaType] = useState('audio')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [])

  async function fetchOptions() {
    const { data: scoresData } = await supabase
      .from('scores')
      .select(`
        id,
        title,
        composer:composer_id ( first_name, last_name ),
        arranger:arranger_id ( first_name, last_name ),
        transcriber:transcriber_id ( first_name, last_name ),
        recorded_by:recorded_by_id ( name )
      `)
    const { data: bandsData } = await supabase.from('bands').select('id, name')
    const { data: performersData } = await supabase.from('performers').select('id, name')
    setScores(scoresData || [])
    setBands(bandsData || [])
    setPerformers(performersData || [])
  }

  function scoreLabel(s) {
    const details = []
    if (s.composer) details.push(`${s.composer.first_name} ${s.composer.last_name}`)
    if (s.arranger) details.push(`arr. ${s.arranger.first_name} ${s.arranger.last_name}`)
    if (s.transcriber) details.push(`trascr. ${s.transcriber.first_name} ${s.transcriber.last_name}`)
    if (s.recorded_by) details.push(`as recorded by ${s.recorded_by.name}`)
    return details.length > 0 ? `${s.title} (${details.join(', ')})` : s.title
  }

  async function handleUpload(e) {
    e.preventDefault()
    setMessage('')

    const isNewPerformer = selectedPerformer === '__new__'

    if (!file || !selectedBand) {
      setMessage('Scegli almeno una band e un file.')
      return
    }

    setUploading(true)

    const fileHash = await calculateFileHash(file)

    const { data: existing, error: hashError } = await supabase
      .from('media_items')
      .select('id, original_filename')
      .eq('file_hash', fileHash)

    if (hashError) {
      setMessage('Errore nel controllo duplicati: ' + hashError.message)
      setUploading(false)
      return
    }

    if (existing && existing.length > 0) {
      setMessage(`Questo file esiste già (caricato come "${existing[0].original_filename}").`)
      setUploading(false)
      return
    }

    let performerId = selectedPerformer || null

    if (isNewPerformer) {
      if (!newPerformerName.trim()) {
        setMessage('Inserisci il nome del performer.')
        setUploading(false)
        return
      }
      const { data: newPerformer, error: performerError } = await supabase
        .from('performers')
        .insert({ name: newPerformerName.trim() })
        .select()
        .single()

      if (performerError) {
        setMessage('Errore nella creazione del performer: ' + performerError.message)
        setUploading(false)
        return
      }
      performerId = newPerformer.id
    }

    const fileExt = file.name.split('.').pop()
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('media-items')
      .upload(safeFileName, file)

    if (uploadError) {
      setMessage('Errore nel caricamento file: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { error: insertError } = await supabase.from('media_items').insert({
      score_id: selectedScore || null,
      performer_id: performerId,
      recording_year: recordingYear ? parseInt(recordingYear) : null,
      media_type: mediaType,
      file_path: safeFileName,
      original_filename: file.name,
      notes: notes || null,
      uploaded_by: userId,
      file_hash: fileHash,
      band_id: selectedBand,
    })

    if (insertError) {
      setMessage('Errore nel salvataggio dati: ' + insertError.message)
    } else {
      setMessage('Media caricato con successo!')
      setFile(null)
      setNotes('')
      setRecordingYear('')
      setNewPerformerName('')
      setSelectedPerformer('')
      fetchOptions()
    }

    setUploading(false)
  }

  return (
    <div>
      <h3>Carica un media (audio/video/immagine)</h3>
      <form onSubmit={handleUpload}>
        <div>
          <label>Brano collegato (opzionale): </label>
          <select value={selectedScore} onChange={(e) => setSelectedScore(e.target.value)}>
            <option value="">-- nessuno --</option>
            {scores.map((s) => (
              <option key={s.id} value={s.id}>{scoreLabel(s)}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Band: </label>
          <select value={selectedBand} onChange={(e) => setSelectedBand(e.target.value)}>
            <option value="">-- scegli --</option>
            {bands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Performer/Interprete (opzionale): </label>
          <select value={selectedPerformer} onChange={(e) => setSelectedPerformer(e.target.value)}>
            <option value="">-- nessuno --</option>
            <option value="__new__">➕ Nuovo performer...</option>
            {performers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedPerformer === '__new__' && (
          <div>
            <label>Nome nuovo performer: </label>
            <input
              type="text"
              value={newPerformerName}
              onChange={(e) => setNewPerformerName(e.target.value)}
              placeholder="Es. Glenn Miller Orchestra"
            />
          </div>
        )}

        <div>
          <label>Anno registrazione (opzionale): </label>
          <input
            type="number"
            value={recordingYear}
            onChange={(e) => setRecordingYear(e.target.value)}
            placeholder="Es. 1995"
          />
        </div>

        <div>
          <label>Tipo media: </label>
          <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="image">Immagine</option>
          </select>
        </div>

        <div>
          <label>Note (opzionale): </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div>
          <label>File: </label>
          <input
            type="file"
            accept="audio/*,video/*,image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Caricamento...' : 'Carica'}
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}

export default UploadMedia