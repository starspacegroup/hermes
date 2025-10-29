# Product Media Management

This document describes the product media management feature that allows site owners to add, manage, and display photos and videos for their products.

## Features

- **Multiple Media Per Product**: Add unlimited images and videos to each product
- **Media Upload**: Direct upload with drag-and-drop support
- **Media Library**: Reusable media library across all products
- **Drag & Drop Reordering**: Easily reorder media items on products
- **Usage Tracking**: Track which products use each media item
- **R2 Storage**: Media stored in Cloudflare R2 for optimal performance

## Architecture

### Database Schema

#### product_media Table

Stores media items attached to specific products:

- `id`: Unique identifier
- `site_id`: Multi-tenant site identifier
- `product_id`: Associated product
- `type`: Media type (image or video)
- `url`: R2 URL to the media file
- `thumbnail_url`: Optional thumbnail for videos
- `filename`: Original filename
- `size`: File size in bytes
- `mime_type`: MIME type (e.g., image/jpeg, video/mp4)
- `width`, `height`: Dimensions for images
- `duration`: Duration in seconds for videos
- `display_order`: Order of display on product page
- `created_at`, `updated_at`: Timestamps

#### media_library Table

Stores all uploaded media for reuse:

- Same fields as `product_media` except `product_id` and `display_order`
- `used_count`: Tracks usage across products

### API Endpoints

#### Upload Media

```
POST /api/media/upload
Content-Type: multipart/form-data

Body:
- file: File to upload
- dimensions (optional): JSON string with {width, height} for images

Response: MediaLibraryItem
```

#### Serve Media

```
GET /api/media/{path}
Response: File stream with caching headers
```

#### Product Media Management

```
GET /api/products/{id}/media
Response: Array<ProductMedia>

POST /api/products/{id}/media
Body: { mediaLibraryId: string, displayOrder?: number }
Response: ProductMedia

PATCH /api/products/{id}/media
Body: { updates: Array<{id: string, displayOrder: number}> }
Response: { success: boolean }

DELETE /api/products/{id}/media
Body: { id: string, mediaLibraryId?: string }
Response: { success: boolean }
```

#### Media Library

```
GET /api/media-library?type={image|video}
Response: Array<MediaLibraryItem>

DELETE /api/media-library
Body: { id: string, force?: boolean }
Response: { success: boolean }
```

## Usage

### Admin Interface

1. **Adding Media to Products**:
   - Edit an existing product
   - Scroll to the "Product Media" section
   - Either:
     - Drag and drop files onto the upload area, OR
     - Click the upload area to select files, OR
     - Click "Browse Media Library" to select from existing media

2. **Reordering Media**:
   - Drag media items in the list to reorder them
   - Changes are saved automatically

3. **Removing Media**:
   - Click the × button on any media item to remove it from the product
   - Media remains in the library for reuse

4. **Managing Media Library**:
   - Click "Browse Media Library" in any product editor
   - Filter by type (All, Images, Videos)
   - Delete unused media items
   - View usage count for each item

### Supported File Types

**Images**:

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

**Videos**:

- MP4 (.mp4)
- WebM (.webm)
- QuickTime (.mov)

**Size Limits**:

- Maximum file size: 50MB per file

## Configuration

### R2 Bucket Setup

The feature requires a Cloudflare R2 bucket configured in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "hermes-media"
preview_bucket_name = "hermes-media-preview"
```

Create R2 buckets:

```bash
# Production bucket
wrangler r2 bucket create hermes-media

# Preview bucket
wrangler r2 bucket create hermes-media-preview
```

### Multi-Tenant Support

All media operations are scoped by `site_id`:

- Media files are stored in R2 with the structure: `{site_id}/images/` or `{site_id}/videos/`
- Database queries are automatically scoped to the current site
- Media library is isolated per site

## Components

### MediaUpload

Reusable component for file uploads:

```svelte
<MediaUpload onMediaUploaded={handleUpload} accept="image/*,video/*" />
```

### MediaBrowser

Browse and select from media library:

```svelte
<MediaBrowser onSelect={handleSelect} selectedIds={[]} />
```

### ProductMediaManager

Complete media management for products:

```svelte
<ProductMediaManager productId={product.id} />
```

## Database Functions

### Product Media

- `getProductMedia(db, siteId, productId)` - Get all media for a product
- `getProductMediaById(db, siteId, mediaId)` - Get single media item
- `createProductMedia(db, siteId, data)` - Add media to product
- `updateProductMediaOrder(db, siteId, mediaId, order)` - Update display order
- `deleteProductMedia(db, siteId, mediaId)` - Remove media from product

### Media Library

- `getMediaLibrary(db, siteId, type?)` - Get all library items (optionally filtered by type)
- `getMediaLibraryItemById(db, siteId, itemId)` - Get single library item
- `createMediaLibraryItem(db, siteId, data)` - Add item to library
- `incrementMediaUsedCount(db, siteId, itemId)` - Increase usage count
- `decrementMediaUsedCount(db, siteId, itemId)` - Decrease usage count
- `deleteMediaLibraryItem(db, siteId, itemId)` - Delete library item

## Testing

Run media tests:

```bash
npm test src/lib/server/db/media.test.ts
```

All tests:

```bash
npm test
```

## Future Enhancements

Potential improvements for the future:

1. **Image Optimization**: Server-side image resizing and format conversion
2. **Video Thumbnails**: Automatic thumbnail generation for videos
3. **Bulk Upload**: Upload multiple files at once
4. **Image Editor**: Basic editing capabilities (crop, rotate)
5. **CDN Integration**: Custom domain for media serving
6. **Product Display**: Update product detail pages to show multiple media items in a gallery
