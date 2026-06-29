import { useEffect, useRef } from 'react'

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random(),
      speed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
    }))

    const planets = [
      { x: 0, y: 80, r: 28, color1: '#4338ca', color2: '#7c3aed', ring: true, floatAmp: 6, floatSpeed: 0.0008 },
      { x: 60, y: 0, r: 16, color1: '#0369a1', color2: '#06b6d4', ring: false, floatAmp: 4, floatSpeed: 0.0012 },
      { x: 0, y: 30, r: 10, color1: '#be185d', color2: '#f43f5e', ring: false, floatAmp: 3, floatSpeed: 0.001 },
    ]

    const objects = [
      { emoji: '🚀', x: 100, y: 200, vx: 0.8, vy: -0.5, rotation: -0.8, size: 22 },
      { emoji: '🛸', x: 300, y: 120, vx: -0.4, vy: 0.3, rotation: 0, size: 18 },
      { emoji: '🛰️', x: 500, y: 280, vx: 0.6, vy: 0.2, rotation: 0.3, size: 16 },
      { emoji: '☄️', x: 200, y: 350, vx: -0.5, vy: -0.4, rotation: 0.5, size: 20 },
      { emoji: '🌙', x: 700, y: 150, vx: 0.3, vy: 0.1, rotation: 0, size: 18 },
    ]

    let shootX = -50, shootY = 50, shootActive = false, shootTimer = 0
    let frame = 0
    let animId: number

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      const nebulas = [
        { x: canvas.width * 0.1, y: canvas.height * 0.2, r: 200, color: '#1e1b4b' },
        { x: canvas.width * 0.8, y: canvas.height * 0.7, r: 180, color: '#0c1a2e' },
        { x: canvas.width * 0.5, y: canvas.height * 0.5, r: 150, color: '#0a0a1e' },
      ]
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.color + '40')
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      })

      stars.forEach(s => {
        const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')'
        ctx.fill()
      })

      shootTimer++
      if (shootTimer > 300) {
        shootActive = true
        shootX = -30
        shootY = Math.random() * canvas.height * 0.5
        shootTimer = 0
      }
      if (shootActive) {
        ctx.save()
        const g = ctx.createLinearGradient(shootX - 80, shootY - 40, shootX, shootY)
        g.addColorStop(0, 'transparent')
        g.addColorStop(1, 'rgba(255,255,255,0.9)')
        ctx.strokeStyle = g
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(shootX - 80, shootY - 40)
        ctx.lineTo(shootX, shootY)
        ctx.stroke()
        ctx.restore()
        shootX += 5
        shootY += 2.5
        if (shootX > canvas.width + 50) shootActive = false
      }

      planets[0].x = canvas.width * 0.85
      planets[1].x = 60
      planets[1].y = canvas.height * 0.75
      planets[2].x = canvas.width * 0.6

      planets.forEach(p => {
        const floatY = p.y + Math.sin(frame * p.floatSpeed) * p.floatAmp
        ctx.save()
        ctx.translate(p.x, floatY)
        const g = ctx.createRadialGradient(-p.r * 0.3, -p.r * 0.3, 0, 0, 0, p.r)
        g.addColorStop(0, p.color1)
        g.addColorStop(1, p.color2)
        ctx.shadowBlur = 20
        ctx.shadowColor = p.color1 + '80'
        ctx.beginPath()
        ctx.arc(0, 0, p.r, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        if (p.ring) {
          ctx.shadowBlur = 0
          ctx.strokeStyle = 'rgba(167,139,250,0.5)'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.ellipse(0, 0, p.r * 1.8, p.r * 0.4, 0, 0, Math.PI * 2)
          ctx.stroke()
        }
        ctx.restore()
      })

      objects.forEach(o => {
        o.x += o.vx
        o.y += o.vy
        if (o.x > canvas.width + 50) o.x = -50
        if (o.x < -50) o.x = canvas.width + 50
        if (o.y > canvas.height + 50) o.y = -50
        if (o.y < -50) o.y = canvas.height + 50
        ctx.save()
        ctx.translate(o.x, o.y)
        ctx.rotate(o.rotation)
        ctx.font = o.size + 'px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(o.emoji, 0, 0)
        ctx.restore()
      })

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
      }}
    />
  )
}
