import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function UploadPart({ userId }) {
  const [scores, setScores] = useState([])
  const [bands, setBands] = useState([])
  const [selectedScore, setSelectedScore] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [partType, setPartType] = useState('full_package')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function fetchOptions() {
      const { data: scoresData } = await supabase.from('scores').select('id, title')
      const { data: bandsData } = await supabase.from('bands').select('id, name')
      setScores(scoresData || [])
      setBands(bandsData || [])
    }
    fetchOptions()
  }, [])

  async function handleUpload(e) {
    e.preventDefault()
    setMessage('')

    if (!file || !selectedScore || !selectedBand) {
      setMessage('Compila tutti i campi e scegli un file.')
      return
    }

    setUploading(true)

    // 1) Genera un nome file unico e sicuro (senza spazi/caratteri strani)
    const fileExt = file.name.split('.').pop()
    const safeFileName = `${crypto.randomUUID()}.${fileExt}`

    // 2) Carica il file fisico nello Storage
    const { error: uploadError } = await supabase.storage
      .from('score-parts')
      .upload(safeFileName, file)

    if (uploadError) {
      setMessage('Errore nel caricamento file: ' + uploadError.message)
      setUploading(false)
      return
    }

    // 3) Crea la riga corrispondente in score_parts
    const { data: newPart, error: insertError } = await supabase
      .from('score_parts')
      .insert({
        score_id: selectedScore,
        part_type: partType,
        file_path: safeFileName,
        original_filename: file.name,
        uploaded_by: userId,
      })
      .select()
      .single()

    if (insertError) {
      setMessage('Errore nel salvataggio dati: ' + insertError.message)
      setUploading(false)
      return
    }

    // 4) Collega la parte alla band scelta
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
            {scores.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
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