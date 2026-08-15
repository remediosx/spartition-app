import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

async function calculateFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function ContributorPicker({ label, value, onChange, contributors, newName, onNewNameChange }) {
  return (
    <div>
      <label>{label}: </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- nessuno --</option>
        <option value="__new__">➕ Nuovo...</option>
        {contributors.map((c) => (
          <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
        ))}
      </select>
      {value === '__new__' && (
        <input
          type="text"
          placeholder="Nome e Cognome"
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
        />
      )}
    </div>
  )
}

function PerformerPicker({ label, value, onChange, performers, newName, onNewNameChange }) {
  return (
    <div>
      <label>{label}: </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- nessuno --</option>
        <option value="__new__">➕ Nuovo...</option>
        {performers.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      {value === '__new__' && (
        <input
          type="text"
          placeholder="Es. Glenn Miller Orchestra"
          value={newName}
          onChange={(e) => onNewNameChange(e.target.value)}
        />
      )}
    </div>
  )
}

function UploadPart({ userId }) {
  const [scores, setScores] = useState([])
  const [bands, setBands] = useState([])
  const [contributors, setContributors] = useState([])
  const [performers, setPerformers] = useState([])
  const [selectedScore, setSelectedScore] = useState('')
  const [newScoreTitle, setNewScoreTitle] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [partType, setPartType] = useState('full_package')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  const [composerId, setComposerId] = useState('')
  const [composerNewName, setComposerNewName] = useState('')
  const [lyricistId, setLyricistId] = useState('')
  const [lyricistNewName, setLyricistNewName] = useState('')
  const [arrangerId, setArrangerId] = useState('')
  const [arrangerNewName, setArrangerNewName] = useState('')
  const [transcriberId, setTranscriberId] = useState('')
  const [transcriberNewName, setTranscriberNewName] = useState('')
  const [recordedById, setRecordedById] = useState('')
  const [recordedByNewName, setRecordedByNewName] = useState('')

  useEffect(() => {
    fetchOptions()
  }, [])

  async function fetchOptions() {
    const { data: scoresData } = await supabase.from('scores').select('id, title')
    const { data: bandsData } = await supabase.from('bands').select('id, name')
    const { data: contributorsData } = await supabase.from('contributors').select('id, first_name, last_name')
    const { data: performersData } = await supabase.from('performers').select('id, name')
    setScores(scoresData || [])
    setBands(bandsData || [])
    setContributors(contributorsData || [])
    setPerformers(performersData || [])
  }

  async function resolveContributorId(selectedId, newName) {
    if (selectedId === '__new__') {
      if (!newName.trim()) return { id: null, error: null }
      const parts = newName.trim().split(' ')
      const first_name = parts[0]
      const last_name = parts.slice(1).join(' ') || ''
      const { data, error } = await supabase
        .from('contributors')
        .insert({ first_name, last_name })
        .select()
        .single()
      if (error) return { id: null, error }
      return { id: data.id, error: null }
    }
    return { id: selectedId || null, error: null }
  }

  async function resolvePerformerId(selectedId, newName) {
    if (selectedId === '__new__') {
      if (!newName.trim()) return { id: null, error: null }
      const { data, error } = await supabase
        .from('performers')
        .insert({ name: newName.trim() })
        .select()
        .single()
      if (error) return { id: null, error }
      return { id: data.id, error: null }
    }
    return { id: selectedId || null, error: null }
  }

  function resetForm() {
    setFile(null)
    setNewScoreTitle('')
    setSelectedScore('')
    setComposerId('')
    setComposerNewName('')
    setLyricistId('')
    setLyricistNewName('')
    setArrangerId('')
    setArrangerNewName('')
    setTranscriberId('')
    setTranscriberNewName('')
    setRecordedById('')
    setRecordedByNewName('')
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

    const fileHash = await calculateFileHash(file)

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
        `Questo file esiste già in archivio (caricato come "${existingParts[0].original_filename}"). Upload annullato.`
      )
      setUploading(false)
      return
    }

    let scoreId = selectedScore

    if (isNewScore) {
      const composerResult = await resolveContributorId(composerId, composerNewName)
      const lyricistResult = await resolveContributorId(lyricistId, lyricistNewName)
      const arrangerResult = await resolveContributorId(arrangerId, arrangerNewName)
      const transcriberResult = await resolveContributorId(transcriberId, transcriberNewName)
      const recordedByResult = await resolvePerformerId(recordedById, recordedByNewName)

      if (
        composerResult.error || lyricistResult.error || arrangerResult.error ||
        transcriberResult.error || recordedByResult.error
      ) {
        setMessage('Errore nella creazione degli autori/interpreti.')
        setUploading(false)
        return
      }

      const { data: newScore, error: scoreError } = await supabase
        .from('scores')
        .insert({
          title: newScoreTitle.trim(),
          composer_id: composerResult.id,
          lyricist_id: lyricistResult.id,
          arranger_id: arrangerResult.id,
          transcriber_id: transcriberResult.id,
          recorded_by_id: recordedByResult.id,
        })
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
      resetForm()
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
          <>
            <div>
              <label>Titolo nuovo brano: </label>
              <input
                type="text"
                value={newScoreTitle}
                onChange={(e) => setNewScoreTitle(e.target.value)}
                placeholder="Es. American Patrol"
              />
            </div>

            <ContributorPicker
              label="Compositore (opzionale)"
              value={composerId}
              onChange={setComposerId}
              contributors={contributors}
              newName={composerNewName}
              onNewNameChange={setComposerNewName}
            />
            <ContributorPicker
              label="Paroliere (opzionale)"
              value={lyricistId}
              onChange={setLyricistId}
              contributors={contributors}
              newName={lyricistNewName}
              onNewNameChange={setLyricistNewName}
            />
            <ContributorPicker
              label="Arrangiatore (opzionale)"
              value={arrangerId}
              onChange={setArrangerId}
              contributors={contributors}
              newName={arrangerNewName}
              onNewNameChange={setArrangerNewName}
            />
            <ContributorPicker
              label="Trascrittore/Adapter (opzionale)"
              value={transcriberId}
              onChange={setTranscriberId}
              contributors={contributors}
              newName={transcriberNewName}
              onNewNameChange={setTranscriberNewName}
            />
            <PerformerPicker
              label="Come registrata da / As played by (opzionale)"
              value={recordedById}
              onChange={setRecordedById}
              performers={performers}
              newName={recordedByNewName}
              onNewNameChange={setRecordedByNewName}
            />
          </>
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