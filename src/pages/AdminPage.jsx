import AdminUsers from '../AdminUsers'

function AdminPage() {
  return (
    <div style={{ border: '2px solid red', padding: '10px', marginTop: '10px' }}>
      <h2>Area Amministrazione</h2>
      <AdminUsers />
    </div>
  )
}

export default AdminPage