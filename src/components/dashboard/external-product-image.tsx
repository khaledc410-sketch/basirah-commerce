/* eslint-disable @next/next/no-img-element -- Commerce media can use merchant-specific hosts. Loading it in the browser avoids turning the image optimizer into a server-side fetch proxy. */

export function ExternalProductImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  let safeSrc: string | null = null;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return null;
    safeSrc = url.toString();
  } catch {
    return null;
  }
  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      src={safeSrc}
    />
  );
}
