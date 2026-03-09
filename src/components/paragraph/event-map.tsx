'use client'
import { useEffect, useRef } from 'react'

interface MapMarker {
  name: string
  lat: number
  lng: number
  description: string
  type?: 'city' | 'battle' | 'site'
}

interface EventMapProps {
  markers: MapMarker[]
}

export function EventMap({ markers }: EventMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || markers.length === 0) return

    // Динамический импорт leaflet (избегаем SSR проблем)
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Стиль карты
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const center: [number, number] = [
        markers.reduce((s, m) => s + m.lat, 0) / markers.length,
        markers.reduce((s, m) => s + m.lng, 0) / markers.length,
      ]

      const map = L.map(mapRef.current, {
        center,
        zoom: markers.length === 1 ? 10 : 7,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 10,
      }).addTo(map)

      // Fix z-index for sticky header overlap
      const panes = map.getPanes()
      if (panes) {
        panes.tooltipPane.style.zIndex = '700'
        panes.popupPane.style.zIndex = '700'
        panes.markerPane.style.zIndex = '800'
        panes.overlayPane.style.zIndex = '800'
      }

      // Inject label styles once
      if (!document.getElementById('leaflet-label-style')) {
        const style = document.createElement('style')
        style.id = 'leaflet-label-style'
        style.textContent = `
          .map-label, .leaflet-tooltip.map-label, .leaflet-tooltip-pane .leaflet-tooltip {
            background: rgba(253,246,236,0.95) !important;
            border: 1.5px solid #C75B39 !important;
            border-radius: 6px !important;
            color: #3D2B1F !important;
            font-family: 'PT Serif', serif !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 4px 8px !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
            white-space: nowrap !important;
            z-index: 900 !important;
            max-width: none !important;
          }
          .map-label.battle-label {
            border-color: #8B1A1A !important;
          }
          .map-label.site-label {
            border-color: #5C7A3E !important;
          }
          .map-label::before { display: none !important; }
          .leaflet-tooltip-pane { z-index: 900 !important; }
          .leaflet-marker-icon {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 800 !important;
          }
          .leaflet-marker-pane { z-index: 800 !important; }
        `
        document.head.appendChild(style)
      }

      const cityIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:24px;height:24px !important;
          background:#C75B39 !important;
          border:2px solid #FDF6EC !important;
          border-radius:50% 50% 50% 0 !important;
          transform:rotate(-45deg) !important;
          box-shadow:0 3px 8px rgba(0,0,0,0.35) !important;
          position: relative !important;
          z-index: 10 !important;
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -28],
      })

      const battleIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:26px;height:26px !important;
          display:flex;align-items:center;justify-content:center !important;
          background:#8B1A1A !important;
          border:2px solid #FDF6EC !important;
          border-radius:4px !important;
          transform:rotate(45deg) !important;
          box-shadow:0 3px 8px rgba(0,0,0,0.45) !important;
          font-size:12px !important;
          line-height:1 !important;
          position: relative !important;
          z-index: 10 !important;
        "><span style="transform:rotate(-45deg);display:block; color: #FDF6EC !important;">⚔</span></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -20],
      })

      const siteIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width:22px;height:22px !important;
          background:#5C7A3E !important;
          border:2px solid #FDF6EC !important;
          border-radius:50% !important;
          box-shadow:0 3px 8px rgba(0,0,0,0.35) !important;
          position: relative !important;
          z-index: 10 !important;
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -18],
      })

      markers.forEach((m) => {
        const isBattle = m.type === 'battle'
        const isSite = m.type === 'site'
        const icon = isBattle ? battleIcon : isSite ? siteIcon : cityIcon
        const labelClass = isBattle ? 'map-label battle-label' : isSite ? 'map-label site-label' : 'map-label'
        const typeLabel = isBattle ? ' ⚔' : ''

        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindTooltip(m.name + typeLabel, {
            permanent: true,
            direction: 'top',
            offset: [0, isBattle ? -25 : -35],
            className: labelClass,
          })
          .bindPopup(`<strong>${m.name}</strong>${isBattle ? ' <span style="color:#8B1A1A">⚔ битва</span>' : ''}<br/><span style="font-size:12px">${m.description}</span>`)
      })

      const bounds = L.latLngBounds(
        markers.map((m) => L.latLng(m.lat, m.lng))
      )

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12, animate: false })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        ;(mapInstanceRef.current as { remove: () => void }).remove()
        mapInstanceRef.current = null
      }
    }
  }, [markers])

  if (markers.length === 0) return null

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 10,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1.5px solid var(--parchment-deep)',
        boxShadow: '0 2px 12px rgba(94,53,214,0.08)',
      }}
    >
      <div
        style={{
          background: 'var(--parchment-dark)',
          padding: '8px 12px',
          borderBottom: '1px solid var(--parchment-deep)',
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          color: 'var(--ink-muted)',
        }}
      >
        🗺️ Карта событий параграфа
      </div>
      <div ref={mapRef} style={{ height: '240px', width: '100%', position: 'relative', zIndex: 1, overflow: 'visible' }} />
    </div>
  )
}
