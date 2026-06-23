import { useState, useCallback } from 'react';
import { sanitizeImageUrl, PLACEHOLDER_IMAGE } from '../../utils/image.js';

export default function AppImage({
  src,
  alt = '',
  className = '',
  style = {},
  fallbackSrc = PLACEHOLDER_IMAGE,
  showLoading = true,
  onError: onErrorProp,
  ...props
}) {
  const [imgSrc, setImgSrc] = useState(() => sanitizeImageUrl(src) || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      setIsLoading(false);
      onErrorProp?.();
    }
  }, [hasError, fallbackSrc, onErrorProp]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  return (
    <div className="app-image-container" style={{ position: 'relative', ...style }}>
      {showLoading && isLoading && (
        <div
          className="app-image-loading"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface, #f5f5f5)',
          }}
        >
          <div
            className="app-image-spinner"
            style={{
              width: 20,
              height: 20,
              border: '2px solid var(--border, #e0e0e0)',
              borderTopColor: 'var(--primary, #4FDBC8)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

export { AppImage as NetworkImage };
