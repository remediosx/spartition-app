import { useState } from 'react'
import { Link } from 'react-router-dom'

function DropdownMenu({ label, items }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-block', marginRight: '15px' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button onClick={() => setOpen(!open)}>
        {label} ▾
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #ccc',
            padding: '5px',
            zIndex: 10,
            minWidth: '150px',
          }}
        >
          {items.map((item) => (
            <div key={item.to} style={{ padding: '5px' }}>
              <Link to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            </div>
          ))}
        </div>
      )}
    </span>
  )
}

export default DropdownMenu