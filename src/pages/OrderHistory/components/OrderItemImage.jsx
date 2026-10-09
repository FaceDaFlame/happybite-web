import { useState } from 'react'
import Icon from '@/components/Icon'

export default function OrderItemImage({ image, name, large }) {
  const [failedImage, setFailedImage] = useState(null)
  const size = large ? 'h-20 w-20' : 'h-16 w-16'
  if (image && image !== failedImage)
    return (
      <img
        src={image}
        alt={name}
        loading="lazy"
        onError={() => setFailedImage(image)}
        className={`${size} rounded-lg object-cover`}
      />
    )
  return (
    <div
      className={`${size} flex items-center justify-center rounded-lg bg-blush`}
    >
      <Icon name="cookie" className="h-8 w-8 text-baked" />
    </div>
  )
}
