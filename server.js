const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = process.env.PORT || 3000

// When using 'output: "standalone"', Next.js generates a .next/standalone directory
// and copies only the necessary files. The appDir is relative to this standalone directory.
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: path.join(__dirname) // Point to the current directory where server.js is
})
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Handle Next.js internal requests (RSC payloads, _next, etc.) normally
      if (pathname.startsWith('/_next') || 
          pathname.startsWith('/api') || 
          pathname.includes('_rsc') ||
          pathname.includes('.') ||
          pathname === '/') {
        await handle(req, res, parsedUrl)
      } else {
        // For SPA routes, serve the main page and let client-side routing handle it
        // This prevents 404 errors on direct access to routes like /wishlist
        await app.render(req, res, '/', query)
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
