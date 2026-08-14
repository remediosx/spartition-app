import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

async function calculateFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function UploadPart({ userId }) {
  const [scores, setScores] = useState([])
  const [bands, setBands] = useState([])
  const [selectedScore, setSelectedScore] = useState('')
  const [newScoreTitle, setNewScoreTitle] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [partType, setPartType] = useState('full_package')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchOptions()
  }, [])

  async function fetchOptions() {
    const { data: scoresData } = await supabase.from('scores').select('id, title')
    const { data: bandsData } = await supabase.from('bands').select('id, name')
    setScores(scoresData || [])
    setBands(bandsData || [])
  }

  async function handleUpload(e) {
    e.preventDefault()
    setMessage('')

    const isNewScore = selectedScore === '__new__'

    if ((!selectedScore || (isNewScore && !newScoreTitle.trim())) || !selectedBand || !file) {
      setMessage('Compila tutti i campi e scegli un file.')
      return
    }

    setUploading(true)

    // Calcola l'impronta digitale del file
    const fileHash = await calculateFileHash(file)

    // Controlla se esiste già un file identico
    const { data: existingParts, error: hashCheckError } = await supabase
      .from('score_parts')
      .select('id, original_filename')
      .eq('file_hash', fileHash)

    if (hashCheckError) {
      setMessage('Errore nel controllo duplicati: ' + hashCheckError.message)
      setUploading(false)
      return
    }

    if (existingParts && existingParts.length > 0) {
      setMessage(
        `Questo file esiste già in archivio (caricato come "${existingParts[0].original_filename}"). Upload annullato per evitare duplicati.`
      )
      setUploading(false)
      return
    }

    let scoreId = selectedScore

    if (isNewScore) {
      const { data: newScore, error: scoreError } = await supabase
        .from('scores')
        .insert({ title: newScoreTitle.trim() })
        .select()
        .single()

      if (scoreError) {
        setMessage('Errore nella creazione del brano: ' + scoreError.message)
        setUploading(false)
        return
      }
      scoreId = newScore.id
    }

    const fileExt = file.name.split('.').pop()
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('score-parts')
      .upload(safeFileName, file)

    if (uploadError) {
      setMessage('Errore nel caricamento file: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: newPart, error: insertError } = await supabase
      .from('score_parts')
      .insert({
        score_id: scoreId,
        part_type: partType,
        file_path: safeFileName,
        original_filename: file.name,
        uploaded_by: userId,
        file_hash: fileHash,
      })
      .select()
      .single()

    if (insertError) {
      setMessage('Errore nel salvataggio dati: ' + insertError.message)
      setUploading(false)
      return
    }

    const { error: linkError } = await supabase
      .from('score_parts_bands')
      .insert({
        score_part_id: newPart.id,
        band_id: selectedBand,
      })

    if (linkError) {
      setMessage('Errore nel collegamento alla band: ' + linkError.message)
    } else {
      setMessage('File caricato con successo!')
      setFile(null)
      setNewScoreTitle('')
      setSelectedScore('')
      fetchOptions()
    }

    setUploading(false)
  }

  return (
    <div>
      <h3>Carica una nuova parte</h3>
      <form onSubmit={handleUpload}>
        <div>
          <label>Brano: </label>
          <select value={selectedScore} onChange={(e) => setSelectedScore(e.target.value)}>
            <option value="">-- scegli --</option>
            <option value="__new__">➕ Nuovo brano...</option>
            {scores.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {selectedScore === '__new__' && (
          <div>
            <label>Titolo nuovo brano: </label>
            <input
              type="text"
              value={newScoreTitle}
              onChange={(e) => setNewScoreTitle(e.target.value)}
              placeholder="Es. Take Five"
            />
          </div>
        )}

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
          <label>Tipo file: </label>
          <select value={partType} onChange={(e) => setPartType(e.target.value)}>
            <option value="full_package">Pacchetto completo</option>
            <option value="conductor_score">Partitura direttore</option>
            <option value="instrument_part">Parte strumento</option>
            <option value="lead_sheet">Lead sheet</option>
            <option value="other">Altro</option>
          </select>
        </div>
        <div>
          <label>File PDF: </label>
          <input
            type="file"
            accept="application/pdf"
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

export default UploadPart