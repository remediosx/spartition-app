import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth'

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
        .select('*')

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
              <p>Questa sezione sarà visibile solo a te come admin.</p>
            </div>
          )}
        </div>
      ) : (
        <Auth />
      )}

      <h2>Brani nel catalogo</h2>
      {loading && <p>Caricamento in corso...</p>}
      {!loading && scores.length === 0 && <p>Nessun brano trovato.</p>}
      {!loading && scores.length > 0 && (
        <ul>
          {scores.map((score) => (
            <li key={score.id}>{score.title}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App