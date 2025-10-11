const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Handle SPA routing - serve index.html for all routes that don't exist
      if (pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        // Check if this is a static file request
        if (pathname.includes('.')) {
          // Let Next.js handle static files
          await handle(req, res, parsedUrl)
        } else {
          // For SPA routes, serve the main page and let client-side routing handle it
          await app.render(req, res, '/', query)
        }
      } else {
        // Let Next.js handle normal requests
        await handle(req, res, parsedUrl)
      }
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
