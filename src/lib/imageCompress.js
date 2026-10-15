/**
 * Perkecil foto di browser sebelum diunggah (sisi terpanjang maks. maxDim px,
 * JPEG kualitas `quality`). Mencegah gagal upload karena batas
 * upload_max_filesize / post_max_size server dan mempercepat unggah dari HP.
 * Bila browser tak bisa membaca file (mis. HEIC), file asli dikembalikan.
 */
export async function compressImage(file, { maxDim = 1920, quality = 0.82, skipBelow = 600 * 1024 } = {}) {
  if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') return file

  let bitmap
  try {
    bitmap = await loadBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const scale = Math.min(1, maxDim / Math.max(width, height))
  // File sudah kecil & tidak perlu diperkecil -> pakai apa adanya
  if (scale === 1 && file.size <= skipBelow) {
    bitmap.close?.()
    return file
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // latar putih untuk PNG transparan
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!blob || blob.size >= file.size) return file

  const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
}

function loadBitmap(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => loadViaImg(file))
  }
  return loadViaImg(file)
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
