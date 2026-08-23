import { Link } from 'react-router-dom'
import UploadMedia from '../UploadMedia'
import MyMediaList from '../MyMediaList'

function MediaPage({ profile, userId }) {
  const canUpload = profile && (profile.role === 'uploader' || profile.role === 'admin')

  return (
    <div>
      <h2>I miei Media</h2>
      <p>Media delle band di cui fai parte. Per il catalogo completo, vai su <Link to="/media-catalog">Catalogo Media</Link>.</p>

      {canUpload && (
        <div style={{ border: '2px solid blue', padding: '10px', marginBottom: '20px' }}>
          <UploadMedia userId={userId} />
        </div>
      )}

      <MyMediaList userId={userId} />
    </div>
  )
}

export default MediaPage