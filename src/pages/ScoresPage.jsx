import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import UploadPart from '../UploadPart'

function ScoresPage({ profile, userId }) {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchMyScores() {
    if (!userId) {
      setScores([])
      setLoading(false)
      return
    }

    setLoading(true)

    // 1) Troviamo le band a cui l'utente è associato
    const { data: perms } = await supabase
      .from('user_band_permissions')
      .select('band_id')
      .eq('user_id', userId)

    const bandIds = (perms || []).map((p) => p.band_id)

    if (bandIds.length === 0) {
      setScores([])
      setLoading(false)
      return
    }

    // 2) Troviamo le parti collegate a quelle band
    const { data: links } = await supabase
      .from('score_parts_bands')
      .select('score_part_id')
      .in('band_id', bandIds)

    const scorePartIds = (links || []).map((l) => l.score_part_id)

    if (scorePartIds.length === 0) {
      setScores([])
      setLoading(false)
      return
    }

    // 3) Troviamo i brani di quelle parti
    const { data: parts } = await supabase
      .from('score_parts')
      .select('score_id')
      .in('id', scorePartIds)

    const scoreIds = [...new Set((parts || []).map((p) => p.score_id))]

    if (scoreIds.length === 0) {
      setScores([])
      setLoading(false)
      return
    }

    // 4) Carichiamo i dettagli di quei brani
    const { data, error } = await supabase
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
      .in('id', scoreIds)

    if (error) {
      console.error('Errore nel caricamento:', error)
    } else {
      setScores(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMyScores()
  }, [userId])

  const canUpload = profile && (profile.role === 'uploader' || profile.role === 'admin')

  return (
    <div>
      <h2>Le mie Parti</h2>
      <p>Brani delle band di cui fai parte. Per il catalogo completo, vai su <Link to="/catalog">Catalogo</Link>.</p>

      {canUpload && (
        <div style={{ border: '2px solid green', padding: '10px', marginBottom: '20px' }}>
          <UploadPart userId={userId} />
        </div>
      )}

      <h3>
        Brani{' '}
        <button onClick={fetchMyScores}>🔄 Aggiorna</button>
      </h3>
      {loading && <p>Caricamento in corso...</p>}
      {!loading && scores.length === 0 && (
        <p>Non hai ancora parti disponibili. Se pensi sia un errore, contatta il titolare della tua band.</p>
      )}
      {!loading && scores.length > 0 && (
        <ul>
          {scores.map((score) => {
            const details = []
            if (score.composer) details.push(`Musica: ${score.composer.first_name} ${score.composer.last_name}`)
            if (score.lyricist) details.push(`Testo: ${score.lyricist.first_name} ${score.lyricist.last_name}`)
            if (score.arranger) details.push(`Arr: ${score.arranger.first_name} ${score.arranger.last_name}`)
            if (score.transcriber) details.push(`Trascr: ${score.transcriber.first_name} ${score.transcriber.last_name}`)
            if (score.recorded_by) details.push(`Come registrata da: ${score.recorded_by.name}`)
            if (score.variant) details.push(`[${score.variant.name}]`)

            return (
              <li key={score.id}>
                <strong>
                  <Link to={`/scores/${score.id}?from=myparts`}>{score.title}</Link>
                </strong>
                {details.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#555' }}>
                    {details.join(' — ')}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ScoresPage