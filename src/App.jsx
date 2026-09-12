import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Auth from './Auth'
import Modal from './Modal'
import Home from './pages/Home'
import CatalogPage from './pages/CatalogPage'
import ScoresPage from './pages/ScoresPage'
import MediaPage from './pages/MediaPage'
import MediaCatalogPage from './pages/MediaCatalogPage'
import AdminPage from './pages/AdminPage'
import ScoreDetailPage from './pages/ScoreDetailPage'
import RequireAdmin from './RequireAdmin'
import MyBandsPage from './pages/MyBandsPage'
import DropdownMenu from './DropdownMenu'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) setAuthModalOpen(false)
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>SPARTITION</h1>

          <div>
            {session ? (
              <span>
                {session.user.email}
                {profile && ` (${profile.role})`}
                {' '}
                <button onClick={handleLogout}>Esci</button>
              </span>
            ) : (
              <button onClick={() => setAuthModalOpen(true)}>Accedi / Registrati</button>
            )}
          </div>
        </div>

        <nav style={{ marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Home</Link>

          <DropdownMenu
            label="Spartiti"
            items={[
              { to: '/scores', label: 'Le mie Parti' },
              { to: '/catalog', label: 'Catalogo' },
            ]}
          />

          <DropdownMenu
            label="Media"
            items={[
              { to: '/media', label: 'I miei Media' },
              { to: '/media-catalog', label: 'Catalogo Media' },
            ]}
          />

          {session && (
            <Link to="/my-bands" style={{ marginRight: '15px' }}>Le mie Band</Link>
          )}
          {profile && profile.role === 'admin' && (
            <Link to="/admin" style={{ marginRight: '15px' }}>Amministrazione</Link>
          )}
        </nav>

        <hr />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route
            path="/scores"
            element={<ScoresPage profile={profile} userId={session?.user?.id} />}
          />
          <Route path="/scores/:id" element={<ScoreDetailPage userId={session?.user?.id} isAdmin={profile?.role === 'admin'} />} />
          <Route
            path="/media"
            element={<MediaPage profile={profile} userId={session?.user?.id} />}
          />
          <Route path="/media-catalog" element={<MediaCatalogPage userId={session?.user?.id} />} />
          <Route path="/my-bands" element={<MyBandsPage userId={session?.user?.id} />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin profile={profile}>
                <AdminPage />
              </RequireAdmin>
            }
          />
        </Routes>

        <Modal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)}>
          <Auth />
        </Modal>
      </div>
    </BrowserRouter>
  )
}

export default App