import Reveal from 'reveal.js'
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm.js'
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js'
import RevealNotes from 'reveal.js/plugin/notes/notes.esm'
import RevealZoom from 'reveal.js/plugin/zoom/zoom.esm'

import 'reveal.js/dist/reveal.css'
import 'reveal.js/dist/theme/black.css'
import './tailwind.css'

const deck = new Reveal({
  hash: true,
  slideNumber: 'c',
  scroll: true,
  plugins: [RevealMarkdown, RevealHighlight, RevealNotes, RevealZoom],
  zoom: {
    maxScale: 25, 
  },
})

deck
  .initialize({
    autoAnimate: true,
    autoAnimateEasing: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    autoAnimateDuration: 0.8,
    autoAnimateUnmatched: false,
    // center: false,
    hash: true,
  })
  .then(() => {
    const magnifier = (() => {
      const lens = document.createElement('div')
      lens.id = 'magnifier-lens'
      lens.setAttribute('aria-hidden', 'true')

      const viewport = document.createElement('div')
      viewport.id = 'magnifier-viewport'

      const content = document.createElement('div')
      content.id = 'magnifier-content'

      const innerReveal = document.createElement('div')
      innerReveal.className = 'reveal magnifier-reveal'

      const innerSlides = document.createElement('div')
      innerSlides.className = 'slides'

      innerReveal.appendChild(innerSlides)
      content.appendChild(innerReveal)
      viewport.appendChild(content)
      lens.appendChild(viewport)
      document.body.appendChild(lens)

      let enabled = false
      let visible = false
      let rafPending = false
      let lastMouseEvent = null
      const scale = 2.75
      const lensOffset = 20

      const getLensRect = () => {
        const rect = lens.getBoundingClientRect()
        const width = rect.width || 260
        const height = rect.height || 260
        return { width, height }
      }

      const hide = () => {
        if (!visible) return
        visible = false
        lens.style.opacity = '0'
      }

      const show = () => {
        if (visible) return
        visible = true
        lens.style.opacity = '1'
      }

      const updateClone = () => {
        innerSlides.replaceChildren()
        const slide = deck.getCurrentSlide()
        if (!slide) return
        const clone = slide.cloneNode(true)
        innerSlides.appendChild(clone)
      }

      const isInside = (rect, x, y) => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom

      const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

      const onMove = (event) => {
        if (!enabled) return
        lastMouseEvent = event
        if (rafPending) return
        rafPending = true
        requestAnimationFrame(() => {
          rafPending = false
          if (!enabled || !lastMouseEvent) return
          const slide = deck.getCurrentSlide()
          if (!slide) {
            hide()
            return
          }
          const rect = slide.getBoundingClientRect()
          const x = lastMouseEvent.clientX
          const y = lastMouseEvent.clientY

          if (!isInside(rect, x, y)) {
            hide()
            return
          }

          show()

          const vw = window.innerWidth
          const vh = window.innerHeight
          const lensRect = getLensRect()
          const left = clamp(x + lensOffset, 0, vw - lensRect.width)
          const top = clamp((vh - lensRect.height) / 2, 0, vh - lensRect.height)
          lens.style.left = `${left}px`
          lens.style.top = `${top}px`

          const rx = x - rect.left
          const ry = y - rect.top
          const tx = lensRect.width / 2 - rx * scale
          const ty = lensRect.height / 2 - ry * scale
          content.style.width = `${rect.width}px`
          content.style.height = `${rect.height}px`
          content.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`
        })
      }

      const setEnabled = (next) => {
        enabled = next
        if (!enabled) hide()
      }

      const isEnabled = () => enabled
      const isVisible = () => visible

      const init = () => {
        updateClone()
        deck.on('slidechanged', () => {
          updateClone()
          hide()
        })
        deck.on('fragmentshown', updateClone)
        deck.on('fragmenthidden', updateClone)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') setEnabled(false)
          if (e.key && e.key.toLowerCase() === 'm') setEnabled(!enabled)
        })
      }

      return { init, isEnabled, isVisible }
    })()

    magnifier.init()

    let scrollTimeout

    window.addEventListener('wheel', (event) => {
      if (scrollTimeout) return

      if (magnifier.isEnabled() && magnifier.isVisible()) return

      if (event.deltaY > 0) {
        deck.next()
      } else {
        deck.prev()
      }

      scrollTimeout = setTimeout(() => {
        scrollTimeout = null
      }, 400)
    })

    deck.sync()
  })
