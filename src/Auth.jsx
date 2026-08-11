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
    <div>
      <h2>{isSignUp ? 'Registrati' : 'Accedi'}</h2>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div>
              <label>Nome: </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label>Cognome: </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </>
        )}
        <div>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
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

      <button onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
      </button>
    </div>
  )
}

export default Auth