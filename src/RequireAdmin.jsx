function RequireAdmin({ profile, children }) {
  if (!profile) {
    return <p>Devi effettuare l'accesso per vedere questa pagina.</p>
  }

  if (profile.role !== 'admin') {
    return <p>Non hai i permessi per accedere a questa sezione.</p>
  }

  return children
}

export default RequireAdmin