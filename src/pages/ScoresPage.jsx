import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import UploadPart from '../UploadPart'

function ScoresPage({ profile, userId }) {
  const [myBands, setMyBands] = useState([])
  const [scores, setScores] = useState([])
  const [loadingBands, setLoadingBands] = useState(true)
  const [loadingScores, setLoadingScores] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedBandId = searchParams.get('band')

  useEffect(() => {
    fetchMyBands()
  }, [userId])

  useEffect(() => {
    if (selectedBandId) {
      fetchScoresForBand(selectedBandId)
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

  async function fetchScoresForBand(bandId) {
    setLoadingScores(true)

    const { data: links } = await supabase
      .from('score_parts_bands')
      .select('score_part_id')
      .eq('band_id', bandId)

    const scorePartIds = (links || []).map((l) => l.score_part_id)

    if (scorePartIds.length === 0) {
      setScores([])
      setLoadingScores(false)
      return
    }

    const { data: parts } = await supabase
      .from('score_parts')
      .select('score_id')
      .in('id', scorePartIds)

    const scoreIds = [...new Set((parts || []).map((p) => p.score_id))]

    if (scoreIds.length === 0) {
      setScores([])
      setLoadingScores(false)
      return
    }

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
    setLoadingScores(false)
  }

  function selectBand(bandId) {
    setSearchParams({ band: bandId })
  }

  function backToBands() {
    setSearchParams({})
  }

  const canUpload = profile && (profile.role === 'uploader' || profile.role === 'admin')
  const currentBand = myBands.find((b) => b.id === Number(selectedBandId))

  if (loadingBands) return <p>Caricamento...</p>

  return (
    <div>
      <h2>Le mie Parti</h2>

      {canUpload && (
        <div style={{ border: '2px solid green', padding: '10px', marginBottom: '20px' }}>
          <UploadPart userId={userId} />
        </div>
      )}

      {!selectedBandId && (
        <>
          <p>Scegli una band per vedere le sue parti:</p>
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
          <h3>{currentBand ? currentBand.name : 'Band'}</h3>

          {loadingScores && <p>Caricamento in corso...</p>}
          {!loadingScores && scores.length === 0 && <p>Nessuna parte disponibile per questa band.</p>}
          {!loadingScores && scores.length > 0 && (
            <ul>
              {scores.map((score) => {
                const details = []
                if (score.composer) details.push(`Musica: ${score.composer.first_name} ${score.composer.last_name}`)
                if (score.lyricist) details.push(`Testo: ${score.lyricist.first_name} ${score.lyricist.last_name}`)
                if (score.arranger) details.push(`Arr: ${score.arranger.first_name} ${score.arranger.last_name}`)
                if (score.transcriber) details.push(`Trascr: ${score.transcriber.first_name} ${score.transcriber.last_name}`)
                if (score.recorded_by) details.push(`Come registrata da: ${score.recorded_by.name}`)
                if (score.variant) details.push(`Variante: ${score.variant.name}`)

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
        </>
      )}
    </div>
  )
}

export default ScoresPage