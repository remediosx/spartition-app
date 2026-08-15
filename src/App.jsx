import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import AdminUsers from './AdminUsers'
import UploadPart from './UploadPart'
import ScoreParts from './ScoreParts'
import UploadMedia from './UploadMedia'
import MediaList from './MediaList'

function App() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      if (!session) {
        setProfile(null)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Errore nel caricamento profilo:', error)
      } else {
        setProfile(data)
      }
    }

    fetchProfile()
  }, [session])

  useEffect(() => {
    async function fetchScores() {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          title,
          composer:composer_id ( first_name, last_name ),
          lyricist:lyricist_id ( first_name, last_name ),
          arranger:arranger_id ( first_name, last_name ),
          transcriber:transcriber_id ( first_name, last_name ),
          recorded_by:recorded_by_id ( name )
        `)

      if (error) {
        console.error('Errore nel caricamento:', error)
      } else {
        setScores(data)
      }
      setLoading(false)
    }

    fetchScores()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <h1>SPARTITION</h1>
      <p>Benvenuto nell'area di gestione spartiti e media di REMEDIOSX.</p>

      {session ? (
        <div>
          <p>
            Sei loggato come: {session.user.email}
            {profile && ` (${profile.first_name} ${profile.last_name} — ruolo: ${profile.role})`}
          </p>
          <button onClick={handleLogout}>Esci</button>

          {profile && profile.role === 'admin' && (
            <div style={{ border: '2px solid red', padding: '10px', marginTop: '10px' }}>
              <h3>Area Amministrazione</h3>
              <AdminUsers />
            </div>
          )}
        </div>
      ) : (
        <Auth />
      )}

          {profile && (profile.role === 'uploader' || profile.role === 'admin') && (
            <div style={{ border: '2px solid green', padding: '10px', marginTop: '10px' }}>
              <UploadPart userId={session.user.id} />
            </div>
          )}

          {profile && (profile.role === 'uploader' || profile.role === 'admin') && (
            <div style={{ border: '2px solid blue', padding: '10px', marginTop: '10px' }}>
              <UploadMedia userId={session.user.id} />
            </div>
          )}

      <h2>Brani nel catalogo</h2>
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

            return (
              <li key={score.id}>
                <strong>{score.title}</strong>
                {details.length > 0 && (
                  <div style={{ fontSize: '0.9em', color: '#555' }}>
                    {details.join(' — ')}
                  </div>
                )}
                <ScoreParts scoreId={score.id} />
              </li>
            )
          })}
        </ul>
      )}

      <h2>Media (audio/video/immagini)</h2>
      <MediaList />

    </div>
  )
}

export default App