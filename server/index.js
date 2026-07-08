import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const statePath = path.join(__dirname, 'data', 'event-state.json')
const scoresPath = path.join(__dirname, 'data', 'game-scores.json')
const envPath = path.join(rootDir, '.env')

loadEnvFile(envPath)

const port = Number(process.env.PORT) || 3000
const adminLogin = process.env.ADMIN_LOGIN 
const adminPassword = process.env.ADMIN_PASSWORD 
const sessionCookieName = 'graduation_admin_session'
const activeSessions = new Set()

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.ico', 'image/x-icon'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
])

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  const envContent = readFileSync(filePath, 'utf8')

  for (const line of envContent.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')

    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function readEventState() {
  const rawState = await readFile(statePath, 'utf8')
  const parsedState = JSON.parse(rawState)

  return {
    nominationsRevealed: Boolean(parsedState.nominationsRevealed),
  }
}

async function writeEventState(nextState) {
  await writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8')
  return nextState
}

async function readGameScores() {
  if (!existsSync(scoresPath)) {
    return []
  }

  const rawScores = await readFile(scoresPath, 'utf8')
  const parsedScores = JSON.parse(rawScores)

  return Array.isArray(parsedScores) ? parsedScores : []
}

async function writeGameScores(scores) {
  await writeFile(scoresPath, `${JSON.stringify(scores, null, 2)}\n`, 'utf8')
  return scores
}

async function deleteGameScores() {
  if (existsSync(scoresPath)) {
    await unlink(scoresPath)
  }
}

function normalizePlayerName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 30)
}

function getTopGameScores(scores, limit = 5) {
  const bestByName = new Map()

  for (const score of scores) {
    if (!score.playerName || !Number.isFinite(score.timeSec) || !Number.isFinite(score.fives)) {
      continue
    }

    const key = score.playerName.toLowerCase()
    const current = bestByName.get(key)

    if (
      !current ||
      score.timeSec < current.timeSec ||
      (score.timeSec === current.timeSec && score.fives > current.fives)
    ) {
      bestByName.set(key, score)
    }
  }

  return [...bestByName.values()]
    .sort((first, second) => first.timeSec - second.timeSec || second.fives - first.fives)
    .slice(0, limit)
}

function sendJson(response, statusCode, data, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  })
  response.end(JSON.stringify(data))
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const separatorIndex = cookie.indexOf('=')

        if (separatorIndex === -1) {
          return [cookie, '']
        }

        return [
          decodeURIComponent(cookie.slice(0, separatorIndex)),
          decodeURIComponent(cookie.slice(separatorIndex + 1)),
        ]
      }),
  )
}

function isAdminAuthenticated(request) {
  const cookies = parseCookies(request.headers.cookie)
  return activeSessions.has(cookies[sessionCookieName])
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
    })

    request.on('end', () => {
      resolve(body)
    })

    request.on('error', reject)
  })
}

async function readJsonBody(request) {
  const body = await readRequestBody(request)

  if (!body) {
    return {}
  }

  return JSON.parse(body)
}

function requireAdmin(request, response) {
  if (isAdminAuthenticated(request)) {
    return true
  }

  sendJson(response, 401, { message: 'Требуется вход в админку' })
  return false
}

async function handleApi(request, response, pathname) {
  if (request.method === 'GET' && pathname === '/api/event-state') {
    sendJson(response, 200, await readEventState())
    return true
  }

  if (request.method === 'GET' && pathname === '/api/admin/session') {
    sendJson(response, 200, { authenticated: isAdminAuthenticated(request) })
    return true
  }

  if (request.method === 'GET' && pathname === '/api/game-scores') {
    const scores = await readGameScores()
    sendJson(response, 200, {
      scores: getTopGameScores(scores),
      total: scores.length,
    })
    return true
  }

  if (request.method === 'POST' && pathname === '/api/game-scores') {
    const result = await readJsonBody(request)
    const playerName = normalizePlayerName(result.playerName)
    const timeSec = Number(result.timeSec)
    const fives = Number(result.fives)

    if (!playerName || playerName.length < 2) {
      sendJson(response, 400, { message: 'Введите имя игрока' })
      return true
    }

    if (!Number.isFinite(timeSec) || timeSec <= 0 || !Number.isFinite(fives) || fives < 0) {
      sendJson(response, 400, { message: 'Некорректный результат игры' })
      return true
    }

    const scores = await readGameScores()
    const score = {
      id: randomBytes(8).toString('hex'),
      playerName,
      timeSec: Math.round(timeSec * 100) / 100,
      fives: Math.floor(fives),
      completed: true,
      createdAt: new Date().toISOString(),
    }

    scores.push(score)
    await writeGameScores(scores)
    sendJson(response, 201, { score })
    return true
  }

  if (request.method === 'POST' && pathname === '/api/admin/login') {
    const credentials = await readJsonBody(request)

    if (credentials.login !== adminLogin || credentials.password !== adminPassword) {
      sendJson(response, 401, { message: 'Неверный логин или пароль' })
      return true
    }

    const sessionToken = randomBytes(32).toString('hex')
    activeSessions.add(sessionToken)
    sendJson(response, 200, { authenticated: true }, {
      'Set-Cookie': `${sessionCookieName}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
    })
    return true
  }

  if (request.method === 'POST' && pathname === '/api/admin/logout') {
    const cookies = parseCookies(request.headers.cookie)
    activeSessions.delete(cookies[sessionCookieName])
    sendJson(response, 200, { authenticated: false }, {
      'Set-Cookie': `${sessionCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
    })
    return true
  }

  if (request.method === 'GET' && pathname === '/api/admin/game-scores') {
    if (!requireAdmin(request, response)) {
      return true
    }

    const scores = await readGameScores()
    sendJson(response, 200, {
      scores: getTopGameScores(scores),
      total: scores.length,
    })
    return true
  }

  if (request.method === 'DELETE' && pathname === '/api/admin/game-scores') {
    if (!requireAdmin(request, response)) {
      return true
    }

    await deleteGameScores()
    sendJson(response, 200, { scores: [], total: 0 })
    return true
  }

  if (request.method === 'POST' && pathname === '/api/admin/game-scores/clear') {
    if (!requireAdmin(request, response)) {
      return true
    }

    await deleteGameScores()
    sendJson(response, 200, { scores: [], total: 0 })
    return true
  }

  if (request.method === 'POST' && pathname === '/api/admin/nominations/open') {
    if (!requireAdmin(request, response)) {
      return true
    }

    sendJson(response, 200, await writeEventState({ nominationsRevealed: true }))
    return true
  }

  if (request.method === 'POST' && pathname === '/api/admin/nominations/close') {
    if (!requireAdmin(request, response)) {
      return true
    }

    sendJson(response, 200, await writeEventState({ nominationsRevealed: false }))
    return true
  }

  if (pathname.startsWith('/api/')) {
    sendJson(response, 404, { message: 'API endpoint not found' })
    return true
  }

  return false
}

async function serveStatic(response, pathname) {
  const safePathname = decodeURIComponent(pathname)
  const requestedPath = path.normalize(safePathname).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(distDir, requestedPath)

  if (!filePath.startsWith(distDir)) {
    filePath = path.join(distDir, 'index.html')
  }

  if (pathname === '/' || !existsSync(filePath)) {
    filePath = path.join(distDir, 'index.html')
  }

  const fileBuffer = await readFile(filePath)
  const extension = path.extname(filePath)

  response.writeHead(200, {
    'Content-Type': mimeTypes.get(extension) || 'application/octet-stream',
  })
  response.end(fileBuffer)
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)

    if (await handleApi(request, response, url.pathname)) {
      return
    }

    await serveStatic(response, url.pathname)
  } catch (error) {
    console.error(error)
    sendJson(response, 500, { message: 'Internal server error' })
  }
})

server.listen(port, () => {
  console.log(`Graduation app is running at http://localhost:${port}`)
})
