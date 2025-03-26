const express = require('express')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = 3000

app.use(cors())

app.use('/music', express.static(path.join(__dirname, 'music')))

app.get('/', (req, res) => {
  res.send('🎶 Backend del reproductor está corriendo.')
})

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor Express corriendo en http://localhost:${PORT}`)
})
