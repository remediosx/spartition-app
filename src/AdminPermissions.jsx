import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminPermissions() {
  const [users, setUsers] = useState([])
  const [bands, setBands] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedBand, setSelectedBand] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
    const { data: bandsData } = await supabase.from('bands').select('id, name')
    const { data: permsData } = await supabase
      .from('user_band_permissions')
      .select(`
        id,
        can_upload,
        profiles ( first_name, last_name, email ),
        bands ( name )
      `)

    setUsers(usersData || [])
    setBands(bandsData || [])
    setPermissions(permsData || [])
    setLoading(false)
  }

  async function handleGrant(e) {
    e.preventDefault()
    setMessage('')

    if (!selectedUser || !selectedBand) {
      setMessage('Scegli utente e band.')
      return
    }

    const { error } = await supabase.from('user_band_permissions').insert({
      user_id: selectedUser,
      band_id: selectedBand,
      can_upload: true,
    })

    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Permesso assegnato!')
      setSelectedUser('')
      setSelectedBand('')
      fetchAll()
    }
  }

  async function handleRevoke(permissionId) {
    const { error } = await supabase
      .from('user_band_permissions')
      .delete()
      .eq('id', permissionId)

    if (error) {
      alert('Errore: ' + error.message)
    } else {
      fetchAll()
    }
  }

  if (loading) return <p>Caricamento permessi...</p>

  return (
    <div>
      <h3>Gestione Permessi Upload per Band</h3>

      <form onSubmit={handleGrant}>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">-- scegli utente --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name} ({u.email})
            </option>
          ))}
        </select>

        <select value={selectedBand} onChange={(e) => setSelectedBand(e.target.value)}>
          <option value="">-- scegli band --</option>
          {bands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <button type="submit">Assegna permesso upload</button>
      </form>
      {message && <p>{message}</p>}

      <h4>Permessi attuali</h4>
      <ul>
        {permissions.map((p) => (
          <li key={p.id}>
            {p.profiles.first_name} {p.profiles.last_name} ({p.profiles.email}) — {p.bands.name}
            {' '}
            <button onClick={() => handleRevoke(p.id)}>Revoca</button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default AdminPermissions