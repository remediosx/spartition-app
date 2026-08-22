import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function CatalogPage() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchScores() {
    setLoading(true)
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

    if (error) {
      console.error('Errore nel caricamento:', error)
    } else {
      setScores(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchScores()
  }, [])

  return (
    <div>
      <h2>
        Catalogo completo{' '}
        <button onClick={fetchScores}>🔄 Aggiorna</button>
      </h2>
      <p>Tutti i brani di tutte le band presenti su SPARTITION.</p>

      {loading && <p>Caricamento in corso...</p>}
      {!loading && scores.length === 0 && <p>Nessun brano trovato.</p>}
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
                  <Link to={`/scores/${score.id}`}>{score.title}</Link>
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

export default CatalogPage