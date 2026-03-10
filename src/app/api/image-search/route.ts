// Edge Runtime — Wikimedia Commons image search proxy
export const runtime = 'edge'

export interface ImageResult {
  title: string
  url: string
  thumb: string
  description: string
  source: string
}

export async function POST(req: Request) {
  try {
    const { query, limit = 6 } = await req.json()

    if (!query || typeof query !== 'string') {
      return Response.json({ error: 'query обязателен' }, { status: 400 })
    }

    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: `${query} filetype:bitmap`,
      gsrnamespace: '6', // File namespace
      gsrlimit: String(Math.min(limit * 2, 20)),
      prop: 'imageinfo|pageterms',
      iiprop: 'url|extmetadata',
      iiurlwidth: '400',
      wbptterms: 'description',
      format: 'json',
      origin: '*',
    })

    const wikiRes = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params.toString()}`,
      { headers: { 'User-Agent': 'HistoryApp/1.0 (educational)' } }
    )

    if (!wikiRes.ok) {
      throw new Error(`Wikimedia error: ${wikiRes.status}`)
    }

    const data = await wikiRes.json()
    const pages = Object.values(data.query?.pages ?? {}) as Array<{
      title: string
      imageinfo?: Array<{
        url: string
        thumburl: string
        extmetadata?: {
          ImageDescription?: { value: string }
          ObjectName?: { value: string }
        }
      }>
      terms?: { description?: string[] }
    }>

    const images: ImageResult[] = pages
      .filter((p) => p.imageinfo?.[0]?.thumburl)
      .slice(0, limit)
      .map((p) => {
        const info = p.imageinfo![0]
        const meta = info.extmetadata
        const rawDesc =
          meta?.ImageDescription?.value ??
          p.terms?.description?.[0] ??
          ''
        // Strip HTML tags from Wikimedia description
        const description = rawDesc.replace(/<[^>]+>/g, '').slice(0, 200)

        return {
          title: p.title.replace(/^File:/, ''),
          url: info.url,
          thumb: info.thumburl,
          description,
          source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        }
      })

    return Response.json({ images })
  } catch (error) {
    console.error('[/api/image-search]', error)
    return Response.json({ images: [] })
  }
}
