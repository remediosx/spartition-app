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

function VariantPicker({ label, value, onChange, variants, newName, onNewNameChange }) {
  return (
    <div>
      <label>{label}: </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- nessuna --</option>
        <option value="__new__">➕ Nuova...</option>
        {variants.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      {value === '__new__' && (
        <input
          type="text"
          placeholder="Es. Note del Maestro Rossi"
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
  const [variants, setVariants] = useState([])
  const [instruments, setInstruments] = useState([])
  const [selectedScore, setSelectedScore] = useState('')
  const [newScoreTitle, setNewScoreTitle] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [partType, setPartType] = useState('full_package')
  const [instrumentId, setInstrumentId] = useState('')
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
  const [variantId, setVariantId] = useState('')
  const [variantNewName, setVariantNewName] = useState('')

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
        lyricist:lyricist_id ( first_name, last_name ),
        arranger:arranger_id ( first_name, last_name ),
        transcriber:transcriber_id ( first_name, last_name ),
        recorded_by:recorded_by_id ( name ),
        variant:variant_id ( name )
      `)
    const { data: bandsData } = await supabase.from('bands').select('id, name')
    const { data: contributorsData } = await supabase.from('contributors').select('id, first_name, last_name')
    const { data: performersData } = await supabase.from('performers').select('id, name')
    const { data: variantsData } = await supabase.from('variants').select('id, name')
    const { data: instrumentsData } = await supabase.from('instruments').select('id, name')
    setScores(scoresData || [])
    setBands(bandsData || [])
    setContributors(contributorsData || [])
    setPerformers(performersData || [])
    setVariants(variantsData || [])
    setInstruments(instrumentsData || [])
  }

  function scoreLabel(s) {
    const details = []
    if (s.composer) details.push(`${s.composer.first_name} ${s.composer.last_name}`)
    if (s.lyricist) details.push(`testo ${s.lyricist.first_name} ${s.lyricist.last_name}`)
    if (s.arranger) details.push(`arr. ${s.arranger.first_name} ${s.arranger.last_name}`)
    if (s.transcriber) details.push(`trascr. ${s.transcriber.first_name} ${s.transcriber.last_name}`)
    if (s.recorded_by) details.push(`as recorded by ${s.recorded_by.name}`)
    if (s.variant) details.push(`[${s.variant.name}]`)
    return details.length > 0 ? `${s.title} (${details.join(', ')})` : s.title
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

  async function resolveVariantId(selectedId, newName) {
    if (selectedId === '__new__') {
      if (!newName.trim()) return { id: null, error: null }
      const { data, error } = await supabase
        .from('variants')
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
    setInstrumentId('')
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
    setVariantId('')
    setVariantNewName('')
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

    const { data: existingLinks, error: hashCheckError } = await supabase
      .from('score_parts_bands')
      .select(`
        band_id,
        score_parts!inner ( original_filename, file_hash )
      `)
      .eq('score_parts.file_hash', fileHash)
      .eq('band_id', selectedBand)

    if (hashCheckError) {
      setMessage('Errore nel controllo duplicati: ' + hashCheckError.message)
      setUploading(false)
      return
    }

    if (existingLinks && existingLinks.length > 0) {
      setMessage(
        `Questo file esiste già per questa band (caricato come "${existingLinks[0].score_parts.original_filename}"). Upload annullato.`
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
      const variantResult = await resolveVariantId(variantId, variantNewName)

      if (
        composerResult.error || lyricistResult.error || arrangerResult.error ||
        transcriberResult.error || recordedByResult.error || variantResult.error
      ) {
        setMessage('Errore nella creazione degli autori/interpreti/varianti.')
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
          variant_id: variantResult.id,
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
        instrument_id: partType === 'instrument_part' ? (instrumentId || null) : null,
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
              <option key={s.id} value={s.id}>{scoreLabel(s)}</option>
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
            <VariantPicker
              label="Variante/Nota distintiva (opzionale)"
              value={variantId}
              onChange={setVariantId}
              variants={variants}
              newName={variantNewName}
              onNewNameChange={setVariantNewName}
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

        {partType === 'instrument_part' && (
          <div>
            <label>Strumento: </label>
            <select value={instrumentId} onChange={(e) => setInstrumentId(e.target.value)}>
              <option value="">-- scegli --</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
        )}

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