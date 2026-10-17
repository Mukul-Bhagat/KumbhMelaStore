import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Star, Trash2, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'

import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CloudinaryImage } from '@/components/media/cloudinary-image'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { getSupabaseBrowserClient } from '@/shared/api/supabase'
import { uploadCloudinaryImage, type CloudinaryUploadResult } from '@/shared/lib/cloudinary'
import type { Database, Json } from '@/shared/types/database'

type ProductRow = Database['public']['Tables']['products']['Row']

interface ProductImagesPanelProps {
  products: ProductRow[]
}

type ProductImageRecord = {
  id: string
  sort_order: number
  is_primary: boolean
  alt_key: string | null
  media: {
    id: string
    public_id: string
    secure_url: string
    alt_text: string | null
  } | null
}

type PendingUpload = {
  file: File
  previewUrl: string
  uploaded: CloudinaryUploadResult | null
}

async function fetchProductImages(productId: string) {
  const { data, error } = await getSupabaseBrowserClient()
    .from('product_images')
    .select('id, sort_order, is_primary, alt_key, media:media_id (id, public_id, secure_url, alt_text)')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return (data ?? []) as ProductImageRecord[]
}

export function ProductImagesPanel({ products }: ProductImagesPanelProps) {
  const queryClient = useQueryClient()
  const [requestedProductId, setRequestedProductId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({})
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowserClient()
  const selectedProductId = products.some((item) => item.id === requestedProductId)
    ? requestedProductId
    : products[0]?.id ?? ''

  const product = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId],
  )
  const imagesQuery = useQuery({
    queryKey: ['admin', 'product-images', selectedProductId],
    queryFn: () => fetchProductImages(selectedProductId),
    enabled: Boolean(selectedProductId),
  })
  const images = imagesQuery.data ?? []

  const releasePreview = (entry: PendingUpload) => URL.revokeObjectURL(entry.previewUrl)
  const refresh = async () => {
    const result = await imagesQuery.refetch()
    if (result.error) throw result.error
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] }),
      queryClient.invalidateQueries({ queryKey: ['kumbh-melastore', 'catalog', 'products'] }),
      queryClient.invalidateQueries({ queryKey: ['kumbh-melastore', 'pages'] }),
    ])
  }

  const saveImageReference = async ({
    provider,
    publicId,
    secureUrl,
    alt,
    width,
    height,
    format,
  }: {
    provider: string
    publicId: string
    secureUrl: string
    alt: string
    width?: number
    height?: number
    format?: string
  }) => {
    if (!selectedProductId) throw new Error('Select or create a product before adding an image.')
    if (imagesQuery.isError) throw new Error('Retry loading the current gallery before adding images.')

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .upsert(
        {
          provider,
          public_id: publicId,
          secure_url: secureUrl,
          alt_text: alt.trim() || null,
          width: width ?? null,
          height: height ?? null,
          format: format ?? null,
          is_public: true,
        },
        { onConflict: 'public_id' },
      )
      .select('id')
      .single()
    if (mediaError) throw mediaError

    const currentImages = imagesQuery.data ?? []
    const { error } = await supabase.from('product_images').insert({
      product_id: selectedProductId,
      media_id: media.id,
      sort_order: currentImages.length,
      is_primary: currentImages.length === 0,
      alt_key: alt.trim() || null,
    })
    if (error) throw error
  }

  const addImage = async () => {
    if (!selectedProductId) {
      setMessageType('error')
      setMessage('Create a product before adding product images.')
      return
    }
    let parsedUrl: URL
    try {
      parsedUrl = new URL(imageUrl.trim())
    } catch {
      setMessageType('error')
      setMessage('Enter a valid HTTPS image URL.')
      return
    }
    if (parsedUrl.protocol !== 'https:') {
      setMessageType('error')
      setMessage('Product image links must use HTTPS.')
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await saveImageReference({
        provider: parsedUrl.hostname === 'res.cloudinary.com' ? 'cloudinary' : 'external',
        publicId: imageUrl.trim(),
        secureUrl: imageUrl.trim(),
        alt: altText,
      })
      setImageUrl('')
      setAltText('')
      setMessageType('success')
      setMessage('Image link saved to this product.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to add image.')
    } finally {
      setSaving(false)
    }
  }

  const selectFiles = (files: FileList | null) => {
    const selected = Array.from(files ?? [])
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
        setMessageType('error')
        setMessage(`${file.name} is not a supported image. Choose JPG, PNG, WebP, or AVIF.`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setMessageType('error')
        setMessage(`${file.name} is larger than the 10 MB upload limit.`)
        return
      }
    }
    for (const pending of pendingUploads) releasePreview(pending)
    setPendingUploads(selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploaded: null,
    })))
    setMessage(null)
  }

  const uploadSelectedFiles = async () => {
    if (!selectedProductId || pendingUploads.length === 0) return
    if (imagesQuery.isError) {
      setMessageType('error')
      setMessage('Retry loading the current product gallery before uploading.')
      return
    }
    setSaving(true)
    setMessage(null)
    let completed = 0
    let failedAfterUpload = false
    try {
      for (const entry of pendingUploads) {
        setUploadProgress(`Uploading image ${completed + 1} of ${pendingUploads.length}…`)
        let uploaded = entry.uploaded
        if (!uploaded) {
          uploaded = await uploadCloudinaryImage(entry.file)
          setPendingUploads((current) => current.map((item) =>
            item === entry ? { ...item, uploaded } : item,
          ))
        }
        try {
          await saveImageReference({
            provider: 'cloudinary',
            publicId: uploaded.publicId,
            secureUrl: uploaded.secureUrl,
            alt: altText.trim() || entry.file.name.replace(/\.[^.]+$/, ''),
            width: uploaded.width,
            height: uploaded.height,
            format: uploaded.format,
          })
        } catch (error) {
          failedAfterUpload = true
          throw new Error(
            `Cloudinary uploaded "${entry.file.name}", but Supabase could not link it: ${error instanceof Error ? error.message : 'unknown error'}. Retry linking this upload; it will not upload the file again.`,
            { cause: error },
          )
        }
        releasePreview(entry)
        setPendingUploads((current) => current.filter((item) => item !== entry))
        completed += 1
      }
      setMessageType('success')
      setMessage(`${completed} image(s) uploaded and linked to the product.`)
      setAltText('')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to upload product images.')
      if (failedAfterUpload) {
        setMessage(`${error instanceof Error ? error.message : 'Image linking failed.'} The uploaded asset is retained so you can retry linking it.`)
      }
    } finally {
      setUploadProgress(null)
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveImageOrder = async (nextImages: ProductImageRecord[]) => {
    const { error } = await supabase.rpc('admin_reorder_product_images', {
      p_product_id: selectedProductId,
      p_images: nextImages.map((image) => ({
        id: image.id,
        altText: altDrafts[image.id] ?? image.alt_key ?? '',
      })) as Json,
    })
    if (error) throw error
  }

  const moveImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex((image) => image.id === imageId)
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= images.length) return
    const nextImages = [...images]
    const [current] = nextImages.splice(currentIndex, 1)
    if (!current) return
    nextImages.splice(swapIndex, 0, current)
    setSaving(true)
    setMessage(null)
    try {
      await saveImageOrder(nextImages)
      setMessageType('success')
      setMessage('Image order and primary image saved.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to reorder images.')
    } finally {
      setSaving(false)
    }
  }

  const saveAltText = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await saveImageOrder(images)
      setMessageType('success')
      setMessage('Image alt text saved.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to save image alt text.')
    } finally {
      setSaving(false)
    }
  }

  const removeImage = async (image: ProductImageRecord) => {
    if (!window.confirm('Remove this image from the product gallery? The Cloudinary asset will remain available in the media library.')) return
    setSaving(true)
    setMessage(null)
    try {
      const { error } = await supabase.from('product_images').delete().eq('id', image.id)
      if (error) throw error
      setAltDrafts((current) => {
        const next = { ...current }
        delete next[image.id]
        return next
      })
      setMessageType('success')
      setMessage('Image removed. The next image is now primary if one remains.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to remove image.')
    } finally {
      setSaving(false)
    }
  }

  if (!product) {
    return (
      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h3 className="font-display text-2xl font-semibold tracking-tight">Product images</h3>
          <p className="text-sm text-muted-foreground">Save the product first, then add and arrange its images here.</p>
        </CardContent>
      </Card>
    )
  }
  if (imagesQuery.isLoading) return <LoadingScreen className="min-h-[20rem]" />

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold tracking-tight">Product images</h3>
            <p className="text-sm text-muted-foreground">Upload multiple JPG, PNG, WebP, or AVIF files up to 10 MB each, preview them, then upload to Cloudinary.</p>
          </div>
          {products.length > 1 ? (
            <div className="w-full space-y-2 md:max-w-xs">
              <Label htmlFor="product-image-product">Product</Label>
              <Select id="product-image-product" value={selectedProductId} onChange={(event) => {
                setRequestedProductId(event.target.value)
                setMessage(null)
              }} disabled={saving}>
                {products.map((item) => <option key={item.id} value={item.id}>{item.slug} ({item.sku})</option>)}
              </Select>
            </div>
          ) : null}
        </div>

        {message ? <Alert title={messageType === 'success' ? 'Image manager' : 'Image action failed'} description={message} variant={messageType === 'success' ? 'success' : 'error'} /> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border p-4">
            <h4 className="font-medium">Add an HTTPS image link</h4>
            <div className="space-y-2"><Label htmlFor="product-image-url">Image URL</Label><Input id="product-image-url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://res.cloudinary.com/..." disabled={saving} /></div>
            <div className="space-y-2"><Label htmlFor="product-image-alt">Alternative text</Label><Input id="product-image-alt" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image" disabled={saving} /></div>
            <Button type="button" variant="outline" onClick={() => void addImage()} disabled={saving || !imageUrl.trim()}><ImagePlus className="h-4 w-4" /> Add image link</Button>
          </div>
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border p-4">
            <h4 className="font-medium">Upload to Cloudinary</h4>
            <p className="text-xs text-muted-foreground">Files are validated locally and uploaded only after you confirm.</p>
            <div className="space-y-2"><Label htmlFor="product-image-files">Choose images</Label><Input ref={fileInputRef} id="product-image-files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" disabled={saving} onChange={(event) => selectFiles(event.target.files)} className="h-auto min-h-11 cursor-pointer py-2 file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium" /></div>
            <Button type="button" onClick={() => void uploadSelectedFiles()} disabled={saving || pendingUploads.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Upload {pendingUploads.length || ''} selected image(s)
            </Button>
          </div>
        </div>

        {pendingUploads.length ? (
          <div className="space-y-3">
            <h4 className="font-medium">Upload preview ({pendingUploads.length})</h4>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pendingUploads.map((entry) => (
                <div key={`${entry.file.name}-${entry.file.lastModified}`} className="relative overflow-hidden rounded-lg border border-border">
                  <div className="aspect-square"><img src={entry.previewUrl} alt={`Preview of ${entry.file.name}`} className="h-full w-full object-cover" /></div>
                  <p className="truncate p-2 text-xs">{entry.file.name}{entry.uploaded ? ' · uploaded, awaiting link' : ''}</p>
                  <Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-1 bg-background/90" aria-label={`Remove ${entry.file.name} from upload queue`} disabled={saving && Boolean(entry.uploaded)} onClick={() => {
                    releasePreview(entry)
                    setPendingUploads((current) => current.filter((item) => item !== entry))
                  }}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {imagesQuery.error ? (
          <div className="space-y-3"><Alert title="Unable to load product images" description={imagesQuery.error instanceof Error ? imagesQuery.error.message : 'Supabase could not load the product gallery.'} variant="error" /><Button type="button" variant="outline" onClick={() => void imagesQuery.refetch()}>Retry image gallery</Button></div>
        ) : null}
        {uploadProgress ? <p className="text-sm text-muted-foreground" role="status">{uploadProgress}</p> : null}
        {imagesQuery.isFetching && !imagesQuery.isLoading ? <p className="text-sm text-muted-foreground">Refreshing image gallery…</p> : null}

        {images.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden p-0 shadow-[var(--shadow-soft)]">
                <div className="aspect-[4/3]">
                  {image.media ? <CloudinaryImage publicId={image.media.secure_url || image.media.public_id} alt={altDrafts[image.id] ?? image.alt_key ?? product.slug} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">Image unavailable</div>}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={image.is_primary ? 'premium' : 'outline'}>{image.is_primary ? 'Primary image' : `Image ${index + 1}`}</Badge>
                    <div className="flex items-center gap-1">
                      {!image.is_primary ? <Button type="button" variant="outline" size="icon-sm" aria-label="Make primary image" disabled={saving} onClick={() => void moveImage(image.id, 'up')}><Star className="h-4 w-4" /></Button> : null}
                      <Button type="button" variant="outline" size="icon-sm" aria-label="Move image up" onClick={() => void moveImage(image.id, 'up')} disabled={saving || index === 0}><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="icon-sm" aria-label="Move image down" onClick={() => void moveImage(image.id, 'down')} disabled={saving || index === images.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="icon-sm" aria-label="Remove image" onClick={() => void removeImage(image)} disabled={saving}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2"><Label htmlFor={`product-image-alt-${image.id}`}>Alternative text</Label><Input id={`product-image-alt-${image.id}`} value={altDrafts[image.id] ?? image.alt_key ?? ''} onChange={(event) => setAltDrafts((current) => ({ ...current, [image.id]: event.target.value }))} disabled={saving} /></div>
                  <p className="break-all text-xs text-muted-foreground">{image.media?.secure_url ?? image.media?.public_id ?? 'Image record has no media file'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Add the first image to establish the product gallery and primary image.</p>
        )}
        {images.length > 0 && Object.keys(altDrafts).length > 0 ? <Button type="button" variant="outline" onClick={() => void saveAltText()} disabled={saving}>Save image alt text</Button> : null}
      </CardContent>
    </Card>
  )
}
