import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

export default function Track() {
  const { tripId } = useParams()
  const [info, setInfo] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/public/tracking/${tripId}`).then(async r => {
      if (!r.ok) throw new Error('not found')
      setInfo(await r.json())
    }).catch(() => setError('Not found'))
  }, [tripId])

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Tracking</Typography>
      {error && <Typography color="error">{error}</Typography>}
      {info && <pre>{JSON.stringify(info, null, 2)}</pre>}
    </Box>
  )
}

