import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Home from './pages/Home'
import CatalogPage from './pages/CatalogPage'
import ScoresPage from './pages/ScoresPage'
import MediaPage from './pages/MediaPage'
import AdminPage from './pages/AdminPage'
import ScoreDetailPage from './pages/ScoreDetailPage'
import RequireAdmin from './RequireAdmin'
import MyBandsPage from './pages/MyBandsPage'

function App() {
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

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <BrowserRouter>
      <div>
        <h1>SPARTITION</h1>

                <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
          <Link to="/catalog" style={{ marginRight: '15px' }}>Catalogo</Link>
          <Link to="/scores" style={{ marginRight: '15px' }}>Spartiti</Link>
          <Link to="/media" style={{ marginRight: '15px' }}>Media</Link>
          {session && (
            <Link to="/my-bands" style={{ marginRight: '15px' }}>Le mie Band</Link>
          )}
          {profile && profile.role === 'admin' && (
            <Link to="/admin" style={{ marginRight: '15px' }}>Amministrazione</Link>
          )}
        </nav>

        {session ? (
          <p>
            Sei loggato come: {session.user.email}
            {profile && ` (${profile.first_name} ${profile.last_name} — ruolo: ${profile.role})`}
            {' '}
            <button onClick={handleLogout}>Esci</button>
          </p>
        ) : (
          <Auth />
        )}

        <hr />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route
            path="/scores"
            element={<ScoresPage profile={profile} userId={session?.user?.id} />}
          />
          <Route
            path="/media"
            element={<MediaPage profile={profile} userId={session?.user?.id} />}
          />
          <Route path="/scores/:id" element={<ScoreDetailPage />} />
          <Route path="/my-bands" element={<MyBandsPage userId={session?.user?.id} />} />
          <Route path="/admin" element={<AdminPage />} /><Route
            path="/admin"
            element={
              <RequireAdmin profile={profile}>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App