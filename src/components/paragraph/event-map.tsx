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
        zoom: markers.length === 1 ? 6 : 4,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 10,
      }).addTo(map)

      // Inject label styles once
      if (!document.getElementById('leaflet-label-style')) {
        const style = document.createElement('style')
        style.id = 'leaflet-label-style'
        style.textContent = `
          .map-label {
            background: rgba(253,246,236,0.92) !important;
            border: 1.5px solid #C75B39 !important;
            border-radius: 6px !important;
            color: #3D2B1F !important;
            font-family: 'PT Serif', serif !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 2px 7px !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.18) !important;
            white-space: nowrap !important;
          }
          .map-label.battle-label {
            border-color: #8B1A1A !important;
          }
          .map-label.site-label {
            border-color: #5C7A3E !important;
          }
          .map-label::before { display: none !important; }
        `
        document.head.appendChild(style)
      }

      const cityIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;
          background:#C75B39;
          border:2px solid #FDF6EC;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -30],
      })

      const battleIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:30px;height:30px;
          display:flex;align-items:center;justify-content:center;
          background:#8B1A1A;
          border:2px solid #FDF6EC;
          border-radius:4px;
          transform:rotate(45deg);
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          font-size:13px;line-height:1;
        "><span style="transform:rotate(-45deg);display:block;">⚔</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -20],
      })

      const siteIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:26px;height:26px;
          background:#5C7A3E;
          border:2px solid #FDF6EC;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
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
            offset: [0, isBattle ? -20 : -30],
            className: labelClass,
          })
          .bindPopup(`<strong>${m.name}</strong>${isBattle ? ' <span style="color:#8B1A1A">⚔ битва</span>' : ''}<br/><span style="font-size:12px">${m.description}</span>`)
      })

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
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1.5px solid var(--parchment-deep)',
        boxShadow: '0 2px 8px rgba(61,43,31,0.1)',
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
      <div ref={mapRef} style={{ height: '220px', width: '100%' }} />
    </div>
  )
}
