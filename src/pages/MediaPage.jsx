import UploadMedia from '../UploadMedia'
import MediaList from '../MediaList'

function MediaPage({ profile, userId }) {
  const canUpload = profile && (profile.role === 'uploader' || profile.role === 'admin')

  return (
    <div>
      <h2>Media</h2>

      {canUpload && (
        <div style={{ border: '2px solid blue', padding: '10px', marginBottom: '20px' }}>
          <UploadMedia userId={userId} />
        </div>
      )}

      <MediaList />
    </div>
  )
}

export default MediaPage