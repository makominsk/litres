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

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

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
        attribution: '\u00a9 OpenStreetMap',
        maxZoom: 10,
      }).addTo(map)

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:28px;height:28px;
          background:#1B2A4A;
          border:3px solid #F5A623;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
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
      className="rounded-2xl overflow-hidden"
      style={{
        border: '1.5px solid var(--cream-deep)',
        boxShadow: '0 2px 12px rgba(27,42,74,0.06)',
      }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid var(--cream-deep)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="text-xs font-bold" style={{ color: 'var(--navy)' }}>
          {'Карта событий'}
        </span>
      </div>
      <div ref={mapRef} style={{ height: '220px', width: '100%' }} />
    </div>
  )
}
