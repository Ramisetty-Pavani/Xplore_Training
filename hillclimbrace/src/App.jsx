import { useEffect, useRef, useState } from 'react'
import './App.css'

const FINISH_DISTANCE = 5200
const COIN_SPACING = 420

function terrainHeight(x) {
  return 34 * Math.sin(x * 0.006) + 17 * Math.sin(x * 0.019) + 48 * Math.sin(x * 0.0018)
}

function terrainSlope(x) {
  return (terrainHeight(x + 2) - terrainHeight(x - 2)) / 4
}

function readBest() {
  try {
    return Number(localStorage.getItem('ridge-runner-best') || 0)
  } catch {
    return 0
  }
}

function App() {
  const canvasRef = useRef(null)
  const controlsRef = useRef({ throttle: false, brake: false, tilt: 0 })
  const phaseRef = useRef('ready')
  const resetGameRef = useRef(null)
  const [phase, setPhase] = useState('ready')
  const [hud, setHud] = useState({ distance: 0, speed: 0, fuel: 100, coins: 0, progress: 0, durationSeconds: 0 })
  const [best, setBest] = useState(readBest)
  const bestRef = useRef(best)
  const [leaderboard, setLeaderboard] = useState([])
  const [apiStatus, setApiStatus] = useState('connecting')
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('ridge-runner-driver') || 'Driver')
  const [savingScore, setSavingScore] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    bestRef.current = best
  }, [best])

  useEffect(() => {
    let active = true
    fetch('/api/leaderboard')
      .then((response) => {
        if (!response.ok) throw new Error('Leaderboard unavailable')
        return response.json()
      })
      .then((entries) => {
        if (!active) return
        setLeaderboard(entries)
        setApiStatus('online')
      })
      .catch(() => {
        if (active) setApiStatus('offline')
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const collectedCoins = new Set()
    const car = { x: 0, altitude: terrainHeight(0) + 14, vx: 0, vy: 0, angle: 0, angularVelocity: 0, fuel: 100, coins: 0 }
    let width = 0
    let height = 0
    let pixelRatio = 1
    let previousTime = 0
    let lastHudTime = 0
    let startedAt = Date.now()
    let animationFrame = 0
    let resizeObserver

    const resetGame = () => {
      car.x = 0
      car.altitude = terrainHeight(0) + 14
      car.vx = 0
      car.vy = 0
      car.angle = 0
      car.angularVelocity = 0
      car.fuel = 100
      car.coins = 0
      startedAt = Date.now()
      collectedCoins.clear()
      controlsRef.current = { throttle: false, brake: false, tilt: 0 }
      phaseRef.current = 'running'
      setPhase('running')
      setHud({ distance: 0, speed: 0, fuel: 100, coins: 0, progress: 0, durationSeconds: 0 })
      setSaveMessage('')
    }

    resetGameRef.current = resetGame

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = bounds.width
      height = bounds.height
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const drawMountains = (baseY, amplitude, color, offset) => {
      context.beginPath()
      context.moveTo(0, height)
      for (let x = 0; x <= width + 8; x += 8) {
        const y = baseY + Math.sin((x + offset) * 0.009) * amplitude + Math.sin((x + offset) * 0.023) * amplitude * 0.24
        context.lineTo(x, y)
      }
      context.lineTo(width, height)
      context.closePath()
      context.fillStyle = color
      context.fill()
    }

    const drawFrame = (time) => {
      if (!width || !height) return
      const dt = Math.min((time - previousTime) / 1000 || 0, 0.034)
      previousTime = time
      const sky = context.createLinearGradient(0, 0, 0, height)
      sky.addColorStop(0, '#83d8e7')
      sky.addColorStop(0.7, '#d5edc6')
      sky.addColorStop(1, '#f7d48b')
      context.fillStyle = sky
      context.fillRect(0, 0, width, height)

      context.fillStyle = '#fff2bd'
      context.beginPath()
      context.arc(width * 0.78, height * 0.2, 34, 0, Math.PI * 2)
      context.fill()

      const cloudDrift = (time * 0.008) % (width + 180)
      for (let index = 0; index < 3; index += 1) {
        const cloudX = ((index * width * 0.43 + cloudDrift) % (width + 160)) - 80
        const cloudY = height * (0.19 + (index % 2) * 0.12)
        context.fillStyle = 'rgba(255, 255, 255, 0.48)'
        context.beginPath()
        context.ellipse(cloudX, cloudY, 38, 10, 0, 0, Math.PI * 2)
        context.ellipse(cloudX + 24, cloudY - 5, 23, 13, 0, 0, Math.PI * 2)
        context.ellipse(cloudX + 44, cloudY + 1, 27, 9, 0, 0, Math.PI * 2)
        context.fill()
      }

      const carScreenX = width * 0.28
      const cameraX = car.x - carScreenX
      drawMountains(height * 0.54, height * 0.055, '#a4d6aa', cameraX * 0.13)
      drawMountains(height * 0.62, height * 0.075, '#65b890', cameraX * 0.25)

      const baseY = height * 0.72
      context.beginPath()
      context.moveTo(0, height)
      for (let screenX = 0; screenX <= width + 6; screenX += 6) {
        const worldX = cameraX + screenX
        context.lineTo(screenX, baseY - terrainHeight(worldX))
      }
      context.lineTo(width, height)
      context.closePath()
      context.fillStyle = '#376f4b'
      context.fill()

      context.beginPath()
      for (let screenX = 0; screenX <= width + 6; screenX += 6) {
        const worldX = cameraX + screenX
        const groundY = baseY - terrainHeight(worldX)
        if (screenX === 0) context.moveTo(screenX, groundY)
        else context.lineTo(screenX, groundY)
      }
      context.strokeStyle = '#b9db79'
      context.lineWidth = 7
      context.lineJoin = 'round'
      context.stroke()

      context.save()
      context.strokeStyle = 'rgba(210, 235, 160, 0.55)'
      context.lineWidth = 2
      for (let screenX = 8; screenX < width; screenX += 34) {
        const worldX = cameraX + screenX
        const groundY = baseY - terrainHeight(worldX)
        context.beginPath()
        context.moveTo(screenX, groundY - 2)
        context.lineTo(screenX - 4, groundY - 9)
        context.moveTo(screenX, groundY - 2)
        context.lineTo(screenX + 4, groundY - 8)
        context.stroke()
      }
      context.restore()

      for (let coinX = 500; coinX < FINISH_DISTANCE; coinX += COIN_SPACING) {
        if (collectedCoins.has(coinX)) continue
        const coinScreenX = carScreenX + coinX - car.x
        if (coinScreenX < -30 || coinScreenX > width + 30) continue
        const coinScreenY = baseY - terrainHeight(coinX) - 70
        context.fillStyle = '#f8bd42'
        context.beginPath()
        context.arc(coinScreenX, coinScreenY, 12, 0, Math.PI * 2)
        context.fill()
        context.strokeStyle = '#fff0a2'
        context.lineWidth = 3
        context.stroke()
        context.fillStyle = '#bd772c'
        context.font = 'bold 13px Bahnschrift, sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText('$', coinScreenX, coinScreenY + 1)
      }

      const finishX = carScreenX + FINISH_DISTANCE - car.x
      if (finishX > -40 && finishX < width + 40) {
        const finishY = baseY - terrainHeight(FINISH_DISTANCE)
        context.strokeStyle = '#f8f3d5'
        context.lineWidth = 5
        context.beginPath()
        context.moveTo(finishX, finishY - 110)
        context.lineTo(finishX, finishY)
        context.stroke()
        context.fillStyle = '#f36b48'
        context.beginPath()
        context.moveTo(finishX, finishY - 110)
        context.lineTo(finishX + 62, finishY - 93)
        context.lineTo(finishX, finishY - 76)
        context.closePath()
        context.fill()
        context.fillStyle = '#254b3a'
        context.font = 'bold 11px Bahnschrift, sans-serif'
        context.textAlign = 'center'
        context.fillText('FINISH', finishX + 28, finishY - 93)
      }

      const carScreenY = baseY - car.altitude
      context.save()
      context.translate(carScreenX, carScreenY - 16)
      context.rotate(car.angle)
      context.fillStyle = 'rgba(29, 53, 42, 0.22)'
      context.beginPath()
      context.ellipse(0, 24, 37, 6, 0, 0, Math.PI * 2)
      context.fill()

      context.fillStyle = '#234a3a'
      for (const wheelX of [-23, 23]) {
        context.beginPath()
        context.arc(wheelX, 19, 11, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = '#d7dfbd'
        context.beginPath()
        context.arc(wheelX, 19, 4, 0, Math.PI * 2)
        context.fill()
        context.fillStyle = '#234a3a'
      }

      context.fillStyle = '#f36b48'
      context.beginPath()
      context.roundRect(-37, -2, 74, 23, 8)
      context.fill()
      context.fillStyle = '#f58e59'
      context.beginPath()
      context.moveTo(-13, -2)
      context.lineTo(-3, -17)
      context.lineTo(17, -17)
      context.lineTo(29, -2)
      context.closePath()
      context.fill()
      context.fillStyle = '#c4eef0'
      context.beginPath()
      context.moveTo(-7, -4)
      context.lineTo(0, -14)
      context.lineTo(12, -14)
      context.lineTo(20, -4)
      context.closePath()
      context.fill()
      context.fillStyle = '#ffe38a'
      context.beginPath()
      context.roundRect(28, 5, 7, 5, 2)
      context.fill()
      context.restore()

      if (phaseRef.current === 'running') {
        const controls = controlsRef.current
        const slope = terrainSlope(car.x)
        const wasGrounded = car.altitude <= terrainHeight(car.x) + 15
        if (controls.throttle) car.vx += 500 * dt
        if (controls.brake) car.vx -= 560 * dt
        if (wasGrounded) car.vx -= slope * 230 * dt
        car.vx *= Math.pow(wasGrounded ? 0.992 : 0.998, dt * 60)
        car.vx = Math.max(-90, Math.min(car.vx, 470))
        car.x = Math.max(0, car.x + car.vx * dt)
        car.vy -= 910 * dt
        car.altitude += car.vy * dt
        const groundHeight = terrainHeight(car.x) + 15

        if (car.altitude <= groundHeight) {
          if (!wasGrounded && car.vy < -580 && car.vx > 150) {
            phaseRef.current = 'wrecked'
            setPhase('wrecked')
          }
          car.altitude = groundHeight
          car.vy = 0
          const targetAngle = -Math.atan(terrainSlope(car.x))
          car.angle += (targetAngle - car.angle) * Math.min(1, dt * 12)
          car.angularVelocity *= 0.86
          if (Math.abs(car.angle) > 1.35 && car.vx > 125) {
            phaseRef.current = 'wrecked'
            setPhase('wrecked')
          }
        } else {
          car.angularVelocity += controls.tilt * 2.8 * dt
          car.angularVelocity *= 0.995
          car.angle += car.angularVelocity * dt
        }

        if (controls.throttle) car.fuel = Math.max(0, car.fuel - 0.8 * dt)
        if (car.fuel <= 0) {
          phaseRef.current = 'wrecked'
          setPhase('wrecked')
        }

        for (let coinX = 500; coinX < FINISH_DISTANCE; coinX += COIN_SPACING) {
          if (!collectedCoins.has(coinX) && Math.abs(car.x - coinX) < 25 && Math.abs(car.altitude - terrainHeight(coinX) - 70) < 90) {
            collectedCoins.add(coinX)
            car.coins += 1
          }
        }

        if (car.x >= FINISH_DISTANCE) {
          phaseRef.current = 'won'
          setPhase('won')
          setHud({ distance: FINISH_DISTANCE / 10, speed: Math.round(Math.abs(car.vx) * 0.14), fuel: car.fuel, coins: car.coins, progress: 1, durationSeconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) })
        }

        const distance = Math.floor(car.x / 10)
        if (distance > bestRef.current) {
          bestRef.current = distance
          setBest(distance)
          try {
            localStorage.setItem('ridge-runner-best', String(distance))
          } catch {
            // Storage can be unavailable in private browsing.
          }
        }
        if (time - lastHudTime > 100) {
          setHud({ distance, speed: Math.round(Math.abs(car.vx) * 0.14), fuel: car.fuel, coins: car.coins, progress: Math.min(car.x / FINISH_DISTANCE, 1), durationSeconds: Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) })
          lastHudTime = time
        }
      }

      animationFrame = window.requestAnimationFrame(drawFrame)
    }

    const onKeyDown = (event) => {
      const key = event.key.toLowerCase()
      if (['arrowright', 'arrowleft', 'arrowup', 'arrowdown', ' '].includes(key)) event.preventDefault()
      if ((key === 'arrowright' || key === 'd') && phaseRef.current === 'ready') resetGame()
      if (key === 'arrowright' || key === 'd') controlsRef.current.throttle = true
      if (key === 'arrowleft' || key === 'a') controlsRef.current.brake = true
      if (key === 'arrowup' || key === 'w') controlsRef.current.tilt = -1
      if (key === 'arrowdown' || key === 's') controlsRef.current.tilt = 1
      if ((key === ' ' || key === 'p') && phaseRef.current === 'running') {
        phaseRef.current = 'paused'
        setPhase('paused')
      } else if ((key === ' ' || key === 'p') && phaseRef.current === 'paused') {
        phaseRef.current = 'running'
        setPhase('running')
      }
      if (key === 'enter' && phaseRef.current !== 'running' && phaseRef.current !== 'paused') resetGame()
    }

    const onKeyUp = (event) => {
      const key = event.key.toLowerCase()
      if (key === 'arrowright' || key === 'd') controlsRef.current.throttle = false
      if (key === 'arrowleft' || key === 'a') controlsRef.current.brake = false
      if (key === 'arrowup' || key === 'w' || key === 'arrowdown' || key === 's') controlsRef.current.tilt = 0
    }

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    resize()
    animationFrame = window.requestAnimationFrame(drawFrame)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const startGame = () => resetGameRef.current?.()
  const togglePause = () => {
    if (phase === 'running') {
      phaseRef.current = 'paused'
      setPhase('paused')
    } else if (phase === 'paused') {
      phaseRef.current = 'running'
      setPhase('running')
    }
  }

  const saveRace = async (event) => {
    event.preventDefault()
    setSavingScore(true)
    setSaveMessage('')
    try {
      const response = await fetch('/api/races', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim(), distanceMeters: hud.distance, coins: hud.coins, durationSeconds: hud.durationSeconds }),
      })
      if (!response.ok) throw new Error('Could not save this run')
      localStorage.setItem('ridge-runner-driver', playerName.trim())
      const entriesResponse = await fetch('/api/leaderboard')
      if (entriesResponse.ok) setLeaderboard(await entriesResponse.json())
      setApiStatus('online')
      setSaveMessage('RUN ADDED TO THE SUMMIT BOARD')
    } catch {
      setApiStatus('offline')
      setSaveMessage('SERVER UNAVAILABLE · RUN NOT SAVED')
    } finally {
      setSavingScore(false)
    }
  }

  const overlayTitle = phase === 'ready' ? 'THE RIDGE IS YOURS' : phase === 'paused' ? 'TAKE A BREATHER' : phase === 'won' ? 'SUMMIT SECURED' : 'WIPEOUT'
  const overlayCopy = phase === 'ready' ? 'One buggy. One big hill. Make it to the finish.' : phase === 'paused' ? 'Your run is paused.' : phase === 'won' ? `You crossed the line with ${hud.coins} coins in the bag.` : hud.fuel <= 0 ? 'Out of fuel. That hill wins this round.' : 'The landing got away from you. Give it another go.'

  return (
    <main className="game-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Ridge Runner home">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>RIDGE<span className="brand-light">RUNNER</span></span>
        </a>
        <div className="event-label"><span className="live-dot" /> ALPINE SPRINT <span className="event-divider">/</span> STAGE 01</div>
        <div className="top-actions">
          <button className="icon-button" type="button" onClick={togglePause} disabled={phase !== 'running' && phase !== 'paused'} aria-label={phase === 'paused' ? 'Resume race' : 'Pause race'} title={phase === 'paused' ? 'Resume race' : 'Pause race'}>
            {phase === 'paused' ? <span className="play-icon" /> : <span className="pause-icon"><i /><i /></span>}
          </button>
          <button className="restart-button" type="button" onClick={startGame}><span aria-hidden="true">↻</span> RESTART</button>
        </div>
      </header>

      <section className="race-section" id="top" aria-label="Hill climb race">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TIME TRIAL <span>01 / 03</span></p>
            <h1>ALPINE <span>ASCENT</span></h1>
          </div>
          <div className="best-distance"><span>PERSONAL BEST</span><strong>{best}<small>m</small></strong></div>
        </div>

        <div className="race-frame">
          <div className="scene-wrap">
            <canvas ref={canvasRef} className="race-canvas" aria-label="Buggy driving over a hilly mountain course" />
            <div className="scene-tag"><span className="flag-mark">⚑</span> RIDGE PASS <span className="tag-divider">·</span> 1,840 M</div>
            <div className="scene-distance"><strong>{hud.distance.toLocaleString()}</strong><span> / 520 m</span></div>
            {phase !== 'running' && (
              <div className="game-overlay">
                <div className="overlay-panel">
                  <span className="overlay-kicker">{phase === 'won' ? 'FINISH LINE' : phase === 'wrecked' ? 'RUN ENDED' : phase === 'paused' ? 'RACE ON HOLD' : 'READY, DRIVER?'}</span>
                  <h2>{overlayTitle}</h2>
                  <p>{overlayCopy}</p>
                  {phase === 'won' && (
                    <form className="score-form" onSubmit={saveRace}>
                      <label htmlFor="driver-name">YOUR NAME</label>
                      <div className="score-submit-row">
                        <input id="driver-name" type="text" value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={24} required />
                        <button type="submit" disabled={savingScore || apiStatus !== 'online'}>{savingScore ? 'SAVING' : 'SAVE SCORE'}</button>
                      </div>
                      {saveMessage && <span className="save-message" role="status">{saveMessage}</span>}
                    </form>
                  )}
                  <button className="start-button" type="button" onClick={startGame}>
                    <span>{phase === 'ready' ? 'START RACE' : phase === 'paused' ? 'RESUME RACE' : 'RACE AGAIN'}</span>
                    <span className="button-arrow" aria-hidden="true">→</span>
                  </button>
                  <div className="overlay-hint"><kbd>←</kbd><kbd>→</kbd> OR <kbd>A</kbd><kbd>D</kbd> TO DRIVE</div>
                </div>
              </div>
            )}
            <div className="finish-progress" aria-label={`Race progress ${Math.round(hud.progress * 100)} percent`}>
              <span style={{ width: `${Math.max(hud.progress * 100, phase === 'ready' ? 0 : 3)}%` }} />
              <i className="progress-start" />
              <i className="progress-finish">⚑</i>
            </div>
          </div>

          <div className="telemetry" aria-label="Race telemetry">
            <div className="telemetry-item distance-item"><span className="telemetry-label">DISTANCE</span><strong>{hud.distance}<small>m</small></strong></div>
            <div className="telemetry-item speed-item"><span className="telemetry-label">SPEED</span><strong>{hud.speed}<small>km/h</small></strong></div>
            <div className="telemetry-item fuel-item">
              <div className="fuel-label"><span className="telemetry-label">FUEL</span><strong>{Math.ceil(hud.fuel)}<small>%</small></strong></div>
              <div className="fuel-track"><span style={{ width: `${hud.fuel}%` }} /></div>
            </div>
            <div className="telemetry-item coin-item"><span className="coin-stamp">$</span><div><span className="telemetry-label">PICKUPS</span><strong>{String(hud.coins).padStart(2, '0')}</strong></div></div>
          </div>
        </div>

        <div className="race-footer">
          <div className="control-hint"><span className="key-cluster"><kbd>A</kbd><kbd>D</kbd></span><span>ACCELERATE / BRAKE</span><span className="hint-separator">·</span><span className="key-cluster"><kbd>W</kbd><kbd>S</kbd></span><span>AIR CONTROL</span></div>
          <div className="stage-count"><span>COURSE</span><strong>01</strong><span className="count-rule" /><span>03</span></div>
        </div>

        <div className="touch-controls" aria-label="Touch driving controls">
          <button className="drive-control brake-control" type="button" onPointerDown={(event) => { event.preventDefault(); controlsRef.current.brake = true }} onPointerUp={() => { controlsRef.current.brake = false }} onPointerLeave={() => { controlsRef.current.brake = false }} onPointerCancel={() => { controlsRef.current.brake = false }} aria-label="Brake"><span>−</span><small>BRAKE</small></button>
          <button className="drive-control tilt-control" type="button" onPointerDown={(event) => { event.preventDefault(); controlsRef.current.tilt = -1 }} onPointerUp={() => { controlsRef.current.tilt = 0 }} onPointerLeave={() => { controlsRef.current.tilt = 0 }} onPointerCancel={() => { controlsRef.current.tilt = 0 }} aria-label="Tilt backward"><span>↶</span><small>AIR</small></button>
          <button className="drive-control tilt-control" type="button" onPointerDown={(event) => { event.preventDefault(); controlsRef.current.tilt = 1 }} onPointerUp={() => { controlsRef.current.tilt = 0 }} onPointerLeave={() => { controlsRef.current.tilt = 0 }} onPointerCancel={() => { controlsRef.current.tilt = 0 }} aria-label="Tilt forward"><span>↷</span><small>AIR</small></button>
          <button className="drive-control throttle-control" type="button" onPointerDown={(event) => { event.preventDefault(); controlsRef.current.throttle = true }} onPointerUp={() => { controlsRef.current.throttle = false }} onPointerLeave={() => { controlsRef.current.throttle = false }} onPointerCancel={() => { controlsRef.current.throttle = false }} aria-label="Accelerate"><span>+</span><small>GO</small></button>
        </div>
      </section>

      <section className="leaderboard-section" aria-labelledby="leaderboard-title">
        <div className="leaderboard-heading">
          <div>
            <p className="eyebrow">THE LOCAL LEGENDS</p>
            <h2 id="leaderboard-title">SUMMIT BOARD</h2>
          </div>
          <span className={`api-status ${apiStatus}`}><i />{apiStatus === 'online' ? 'LIVE RESULTS' : apiStatus === 'connecting' ? 'CONNECTING' : 'SERVER OFFLINE'}</span>
        </div>
        <div className="leaderboard-table">
          <div className="leaderboard-row leaderboard-columns"><span>RANK</span><span>DRIVER</span><span>DISTANCE</span><span>COINS</span><span>TIME</span></div>
          {leaderboard.length === 0 ? (
            <div className="leaderboard-empty">{apiStatus === 'online' ? 'No finishers yet. Make the first mark.' : 'Start the Java server to load race results.'}</div>
          ) : leaderboard.slice(0, 5).map((entry, index) => (
            <div className="leaderboard-row" key={entry.id}>
              <span className="leaderboard-rank">{String(index + 1).padStart(2, '0')}</span>
              <strong>{entry.playerName}</strong>
              <span>{entry.distanceMeters}<small> m</small></span>
              <span>{String(entry.coins).padStart(2, '0')}</span>
              <span>{Math.floor(entry.durationSeconds / 60)}:{String(entry.durationSeconds % 60).padStart(2, '0')}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="page-footer"><span>BUILT FOR THE LONG WAY UP</span><span>KEEP IT BETWEEN THE PINES <b>✳</b></span></footer>
    </main>
  )
}

export default App