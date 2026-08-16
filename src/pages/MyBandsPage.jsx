import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function MyBandsPage({ userId }) {
  const [myBands, setMyBands] = useState([])
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState([])
  const [selectedBand, setSelectedBand] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [newBandName, setNewBandName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (userId) fetchAll()
  }, [userId])

  async function fetchAll() {
    setLoading(true)
    const { data: bandsData } = await supabase
      .from('bands')
      .select('id, name')
      .eq('owner_id', userId)

    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')

    const { data: permsData } = await supabase
      .from('user_band_permissions')
      .select(`
        id,
        can_upload,
        band_id,
        profiles ( first_name, last_name, email )
      `)

    setMyBands(bandsData || [])
    setUsers(usersData || [])
    setPermissions(permsData || [])
    setLoading(false)
  }

  async function handleCreateBand(e) {
    e.preventDefault()
    setMessage('')
    if (!newBandName.trim()) return

    const { error } = await supabase
      .from('bands')
      .insert({ name: newBandName.trim(), owner_id: userId })

    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Band creata!')
      setNewBandName('')
      fetchAll()
    }
  }

  async function handleGrant(e) {
    e.preventDefault()
    setMessage('')

    if (!selectedBand || !selectedUser) {
      setMessage('Scegli band e utente.')
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

  if (loading) return <p>Caricamento...</p>

  return (
    <div>
      <h2>Le mie Band</h2>

      <h3>Crea una nuova band</h3>
      <form onSubmit={handleCreateBand}>
        <input
          type="text"
          value={newBandName}
          onChange={(e) => setNewBandName(e.target.value)}
          placeholder="Nome nuova band"
        />
        <button type="submit">Crea Band</button>
      </form>

      <h3>Band di cui sei titolare</h3>
      {myBands.length === 0 && <p>Non sei ancora titolare di nessuna band.</p>}
      <ul>
        {myBands.map((b) => (
          <li key={b.id}>{b.name}</li>
        ))}
      </ul>

      {myBands.length > 0 && (
        <>
          <h3>Assegna permesso di upload</h3>
          <form onSubmit={handleGrant}>
            <select value={selectedBand} onChange={(e) => setSelectedBand(e.target.value)}>
              <option value="">-- scegli una tua band --</option>
              {myBands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">-- scegli utente --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>

            <button type="submit">Assegna</button>
          </form>

          <h3>Permessi attuali sulle tue band</h3>
          <ul>
            {permissions
              .filter((p) => myBands.some((b) => b.id === p.band_id))
              .map((p) => (
                <li key={p.id}>
                  {p.profiles.first_name} {p.profiles.last_name} ({p.profiles.email})
                  {' — '}
                  {myBands.find((b) => b.id === p.band_id)?.name}
                  {' '}
                  <button onClick={() => handleRevoke(p.id)}>Revoca</button>
                </li>
              ))}
          </ul>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}

export default MyBandsPage