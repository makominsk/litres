'use client'
import { useEffect, useRef } from 'react'

interface MapMarker {
  name: string
  lat: number
  lng: number
  description: string
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

      const icon = L.divIcon({
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

      markers.forEach((m) => {
        L.marker([m.lat, m.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${m.name}</strong><br/><span style="font-size:12px">${m.description}</span>`)
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
