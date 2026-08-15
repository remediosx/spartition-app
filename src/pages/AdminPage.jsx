import AdminUsers from '../AdminUsers'
import AdminBands from '../AdminBands'
import AdminPermissions from '../AdminPermissions'

function AdminPage() {
  return (
    <div style={{ border: '2px solid red', padding: '10px', marginTop: '10px' }}>
      <h2>Area Amministrazione</h2>

      <AdminUsers />
      <hr />
      <AdminBands />
      <hr />
      <AdminPermissions />
    </div>
  )
}

export default AdminPage