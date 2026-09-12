import { useState } from 'react'
import { supabase } from './supabaseClient'

function Auth() {
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      })
      if (error) {
        setMessage('Errore: ' + error.message)
      } else {
        setMessage('Registrazione avvenuta! Controlla la tua email per confermare.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setMessage('Errore: ' + error.message)
      } else {
        setMessage('Accesso effettuato!')
      }
    }
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', maxWidth: '350px' }}>
      <h2 style={{ marginTop: 0 }}>{isSignUp ? 'Registrati' : 'Accedi'}</h2>

      <div style={{ marginBottom: '15px' }}>
        {isSignUp ? (
          <span>Hai già un account?{' '}
            <button type="button" onClick={() => setIsSignUp(false)}>Accedi</button>
          </span>
        ) : (
          <span>Non hai un account?{' '}
            <button type="button" onClick={() => setIsSignUp(true)}>Registrati</button>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label>Nome: </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Cognome: </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </>
        )}
        <div style={{ marginBottom: '10px' }}>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">{isSignUp ? 'Registrati' : 'Accedi'}</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  )
}

export default Auth