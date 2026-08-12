import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Errore nel caricamento utenti:', error)
    } else {
      setUsers(data)
    }
    setLoading(false)
  }

  async function handleRoleChange(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      alert('Errore nel cambio ruolo: ' + error.message)
    } else {
      fetchUsers()
    }
  }

  if (loading) return <p>Caricamento utenti...</p>

  return (
    <div>
      <h3>Gestione Utenti</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cognome</th>
            <th>Email</th>
            <th>Ruolo</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.first_name}</td>
              <td>{u.last_name}</td>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                >
                  <option value="viewer">viewer</option>
                  <option value="downloader">downloader</option>
                  <option value="uploader">uploader</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AdminUsers