const FILE_ID_PATTERN = /^[\w-]{10,}$/

export function getGoogleDriveFileId(value: string | undefined | null): string {
  if (!value) return ''
  const input = String(value).trim()
  if (FILE_ID_PATTERN.test(input)) return input

  try {
    const url = new URL(input)
    if (!['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com'].includes(url.hostname)) return ''
    const queryId = url.searchParams.get('id')
    if (queryId && FILE_ID_PATTERN.test(queryId)) return queryId
    const pathMatch = url.pathname.match(/\/file\/d\/([\w-]+)/)
    return pathMatch?.[1] ?? ''
  } catch {
    return ''
  }
}

export function getGoogleDrivePreviewUrl(value: string | undefined | null): string {
  const id = getGoogleDriveFileId(value)
  return id ? `https://drive.google.com/file/d/${id}/preview` : ''
}

export function getGoogleDriveThumbnailUrl(value: string | undefined | null, width = 1200): string {
  const id = getGoogleDriveFileId(value)
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : ''
}

export function getVideoThumbnailUrl(value: string | undefined | null): string {
  const driveThumbnail = getGoogleDriveThumbnailUrl(value)
  if (driveThumbnail) return driveThumbnail
  if (!value) return ''

  try {
    const url = new URL(value)
    const videoId = url.hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)
        ? url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
        : ''
    return videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : ''
  } catch {
    return ''
  }
}

export function getGoogleDriveOpenUrl(value: string | undefined | null, fallbackUrl: string): string {
  const id = getGoogleDriveFileId(value)
  return id ? `https://drive.google.com/file/d/${id}/view` : fallbackUrl
}

export function getVideoEmbedUrl(value: string | undefined | null): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : ''
    }
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      const id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1]
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : ''
    }
    if (url.hostname === 'vimeo.com' || url.hostname === 'www.vimeo.com') {
      const id = url.pathname.match(/^\/(?:video\/)?(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : ''
    }
  } catch {
    return ''
  }
  return ''
}
