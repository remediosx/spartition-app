import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ScoreParts from '../ScoreParts'

function ScoreDetailPage() {
  const { id } = useParams()
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScore()
  }, [id])

  async function fetchScore() {
    setLoading(true)
    const { data, error } = await supabase
      .from('scores')
      .select(`
        id,
        title,
        notes,
        composer:composer_id ( first_name, last_name ),
        lyricist:lyricist_id ( first_name, last_name ),
        arranger:arranger_id ( first_name, last_name ),
        transcriber:transcriber_id ( first_name, last_name ),
        recorded_by:recorded_by_id ( name )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Errore nel caricamento brano:', error)
      setScore(null)
    } else {
      setScore(data)
    }
    setLoading(false)
  }

  if (loading) return <p>Caricamento...</p>
  if (!score) return <p>Brano non trovato.</p>

  return (
    <div>
      <Link to="/scores">← Torna all'elenco</Link>
      <h2>{score.title}</h2>

      <ul>
        {score.composer && <li>Musica: {score.composer.first_name} {score.composer.last_name}</li>}
        {score.lyricist && <li>Testo: {score.lyricist.first_name} {score.lyricist.last_name}</li>}
        {score.arranger && <li>Arrangiamento: {score.arranger.first_name} {score.arranger.last_name}</li>}
        {score.transcriber && <li>Trascrizione: {score.transcriber.first_name} {score.transcriber.last_name}</li>}
        {score.recorded_by && <li>Come registrata da: {score.recorded_by.name}</li>}
      </ul>

      {score.notes && <p><em>Note: {score.notes}</em></p>}

      <h3>Parti disponibili</h3>
      <ScoreParts scoreId={score.id} />
    </div>
  )
}

export default ScoreDetailPage