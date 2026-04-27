import React, { useState, useRef, useLayoutEffect, useEffect } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

/**
 * 캐시에서 동기적으로 로드된 img는 `load`가 리스너 연결 전에 끝날 수 있음.
 * (FeedCard 등) onLoad에만 의지하면 투명(opacity-0)이 영구 유지될 수 있어 complete 시 onLoad를 보정 호출.
 */
export function ImageWithFallback(props: ImgProps) {
  const [didError, setDidError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const onLoadRef = useRef<ImgProps["onLoad"]>(undefined);
  onLoadRef.current = props.onLoad;

  const { src, alt, style, className, onError: onErrorUser, onLoad, ...rest } = props;

  useEffect(() => {
    setDidError(false);
  }, [src]);

  useLayoutEffect(() => {
    const el = imgRef.current;
    if (didError || !el || !src) return;
    if (el.complete && el.naturalWidth > 0) {
      onLoadRef.current?.({
        target: el,
        currentTarget: el,
      } as React.SyntheticEvent<HTMLImageElement, Event>);
    }
  }, [src, didError]);

  const handleError: ImgProps["onError"] = (e) => {
    setDidError(true);
    onErrorUser?.(e);
  };

  const handleLoad: ImgProps["onLoad"] = (e) => {
    onLoad?.(e);
  };

  return didError ? (
    <div className={`inline-block bg-gray-100 text-center align-middle ${className ?? ""}`} style={style}>
      <div className="flex h-full w-full items-center justify-center">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
