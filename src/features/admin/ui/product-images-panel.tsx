import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react'
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
import { uploadCloudinaryImage } from '@/shared/lib/cloudinary'
import type { Database } from '@/shared/types/database'

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

async function fetchProductImages(productId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('product_images')
    .select(
      'id, sort_order, is_primary, alt_key, media:media_id (id, public_id, secure_url, alt_text)',
    )
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as ProductImageRecord[]
}

export function ProductImagesPanel({ products }: ProductImagesPanelProps) {
  const [requestedProductId, setRequestedProductId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [altText, setAltText] = useState('')
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

  const refresh = async () => {
    const result = await imagesQuery.refetch()
    if (result.error) {
      throw result.error
    }
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
      })
      setImageUrl('')
      setAltText('')
      setMessageType('success')
      setMessage('Image URL added and linked to the product.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to add image.')
    } finally {
      setSaving(false)
    }
  }

  const saveImageReference = async ({
    provider,
    publicId,
    secureUrl,
    width,
    height,
    format,
  }: {
    provider: string
    publicId: string
    secureUrl: string
    width?: number
    height?: number
    format?: string
  }) => {
    if (!selectedProductId) {
      throw new Error('Select or create a product before adding an image.')
    }
    if (imagesQuery.isError) {
      throw new Error('The current product gallery could not be loaded. Retry it before adding images.')
    }

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .upsert(
        {
          provider,
          public_id: publicId,
          secure_url: secureUrl,
          alt_text: altText.trim() || null,
          width: width ?? null,
          height: height ?? null,
          format: format ?? null,
          is_public: true,
        },
        { onConflict: 'public_id' },
      )
      .select('id')
      .single()

    if (mediaError) {
      throw mediaError
    }

    const currentImages = imagesQuery.data ?? []
    const { error } = await supabase.from('product_images').insert({
      product_id: selectedProductId,
      media_id: media.id,
      sort_order: currentImages.length,
      is_primary: currentImages.length === 0,
      alt_key: altText.trim() || null,
    })

    if (error) {
      throw error
    }
  }

  const uploadImage = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const uploaded = await uploadCloudinaryImage(file)
      await saveImageReference({
        provider: 'cloudinary',
        publicId: uploaded.publicId,
        secureUrl: uploaded.secureUrl,
        width: uploaded.width,
        height: uploaded.height,
        format: uploaded.format,
      })
      setMessageType('success')
      setMessage('Image uploaded to Cloudinary and linked to the product.')
      setAltText('')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to upload image.')
    } finally {
      setSaving(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = async (imageId: string) => {
    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase.from('product_images').delete().eq('id', imageId)
      if (error) {
        throw error
      }
      const removedIndex = images.findIndex((image) => image.id === imageId)
      const nextPrimary = images[removedIndex === 0 ? 1 : 0]
      if (removedIndex === 0 && nextPrimary) {
        const { error: promoteError } = await supabase
          .from('product_images')
          .update({ is_primary: true })
          .eq('id', nextPrimary.id)
        if (promoteError) {
          throw promoteError
        }
      }
      setMessageType('success')
      setMessage('Image removed from the product.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to remove image.')
    } finally {
      setSaving(false)
    }
  }

  const moveImage = async (imageId: string, direction: 'up' | 'down') => {
    const currentImages = imagesQuery.data ?? []
    const currentIndex = currentImages.findIndex((image) => image.id === imageId)
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= currentImages.length) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const current = currentImages[currentIndex]
      const other = currentImages[swapIndex]
      if (!current || !other) {
        return
      }

      const [currentUpdate, otherUpdate] = await Promise.all([
        supabase
          .from('product_images')
          .update({ sort_order: other.sort_order, is_primary: swapIndex === 0 })
          .eq('id', current.id),
        supabase
          .from('product_images')
          .update({ sort_order: current.sort_order, is_primary: currentIndex === 0 })
          .eq('id', other.id),
      ])

      const updateError = currentUpdate.error ?? otherUpdate.error
      if (updateError) {
        throw updateError
      }

      setMessageType('success')
      setMessage('Image order updated.')
      await refresh()
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Unable to reorder images.')
    } finally {
      setSaving(false)
    }
  }

  if (!product) {
    return (
      <Card className="shadow-[var(--shadow-soft)]">
        <CardContent className="space-y-3 p-6">
          <h3 className="font-display text-2xl font-semibold tracking-tight">Product images</h3>
          <p className="text-sm text-muted-foreground">
            Create a product above to add its image links or upload images to Cloudinary.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (imagesQuery.isLoading) {
    return <LoadingScreen className="min-h-[20rem]" />
  }

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-semibold tracking-tight">Product images</h3>
            <p className="text-sm text-muted-foreground">
              Paste an HTTPS image URL or upload a JPG, PNG, WebP, or AVIF (10 MB max) to Cloudinary.
            </p>
          </div>
          <div className="w-full space-y-2 md:max-w-xs">
            <Label htmlFor="product-image-product">Product</Label>
            <Select
              id="product-image-product"
              value={selectedProductId}
              onChange={(event) => {
                setRequestedProductId(event.target.value)
                setMessage(null)
              }}
              disabled={saving}
            >
              {products.map((item) => (
                <option key={item.id} value={item.id}>{item.slug} ({item.sku})</option>
              ))}
            </Select>
          </div>
        </div>

        {message ? (
          <Alert
            title={messageType === 'success' ? 'Image manager' : 'Image action failed'}
            description={message}
            variant={messageType === 'success' ? 'success' : 'error'}
          />
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3 rounded-[var(--radius-card)] border border-border p-4">
            <div className="space-y-1">
              <h4 className="font-medium">Use an image URL</h4>
              <p className="text-xs text-muted-foreground">Cloudinary links and other HTTPS image links are supported.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-image-url">Image URL</Label>
              <Input
                id="product-image-url"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://res.cloudinary.com/..."
                disabled={saving}
              />
            </div>
            <Button type="button" variant="outline" onClick={() => void addImage()} disabled={saving || !imageUrl.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              Add image link
            </Button>
          </div>

          <div className="space-y-3 rounded-[var(--radius-card)] border border-border p-4">
            <div className="space-y-1">
              <h4 className="font-medium">Upload to Cloudinary</h4>
              <p className="text-xs text-muted-foreground">Uploads are stored in Cloudinary, then registered and linked in Supabase.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-image-file">Choose image</Label>
              <Input
                ref={fileInputRef}
                id="product-image-file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={saving}
                onChange={(event) => {
                  void uploadImage(event.target.files?.[0])
                }}
                className="h-auto min-h-11 cursor-pointer py-2 file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-image-alt">Alternative text (optional)</Label>
          <Input
            id="product-image-alt"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Describe the product image"
            disabled={saving}
          />
        </div>

        {imagesQuery.error ? (
          <div className="space-y-3">
            <Alert
              title="Unable to load product images"
              description={imagesQuery.error instanceof Error ? imagesQuery.error.message : 'Supabase could not load the product gallery.'}
              variant="error"
            />
            <Button type="button" variant="outline" onClick={() => void imagesQuery.refetch()}>
              Retry image gallery
            </Button>
          </div>
        ) : null}

        {saving ? (
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading or saving image…
          </p>
        ) : null}

        {imagesQuery.isFetching && !imagesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Refreshing image gallery…</p>
        ) : null}

        {images.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <Card key={image.id} className="overflow-hidden p-0 shadow-[var(--shadow-soft)]">
                <div className="aspect-[4/3]">
                  <CloudinaryImage
                    publicId={image.media?.secure_url ?? image.media?.public_id ?? ''}
                    alt={image.alt_key ?? product.slug}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={image.is_primary ? 'premium' : 'outline'}>
                      {image.is_primary ? 'Primary' : `#${index + 1}`}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => void moveImage(image.id, 'up')}
                        disabled={saving || index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => void moveImage(image.id, 'down')}
                        disabled={saving || index === images.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => void removeImage(image.id)}
                        disabled={saving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs break-all text-muted-foreground">
                    {image.media?.secure_url ?? image.media?.public_id}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add the first image URL to establish the gallery order.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
