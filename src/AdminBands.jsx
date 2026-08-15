import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminBands() {
  const [bands, setBands] = useState([])
  const [newBandName, setNewBandName] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBands()
  }, [])

  async function fetchBands() {
    setLoading(true)
    const { data, error } = await supabase.from('bands').select('id, name, description')
    if (error) {
      console.error('Errore nel caricamento band:', error)
    } else {
      setBands(data)
    }
    setLoading(false)
  }

  async function handleCreateBand(e) {
    e.preventDefault()
    setMessage('')
    if (!newBandName.trim()) return

    const { error } = await supabase.from('bands').insert({ name: newBandName.trim() })

    if (error) {
      setMessage('Errore: ' + error.message)
    } else {
      setMessage('Band creata!')
      setNewBandName('')
      fetchBands()
    }
  }

  if (loading) return <p>Caricamento band...</p>

  return (
    <div>
      <h3>Gestione Band</h3>

      <form onSubmit={handleCreateBand}>
        <input
          type="text"
          value={newBandName}
          onChange={(e) => setNewBandName(e.target.value)}
          placeholder="Nome nuova band"
        />
        <button type="submit">Crea Band</button>
      </form>
      {message && <p>{message}</p>}

      <ul>
        {bands.map((b) => (
          <li key={b.id}>{b.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default AdminBands