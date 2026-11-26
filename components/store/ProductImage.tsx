import Image, { type ImageProps } from "next/image";

/** next/image wrapper: SVG placeholders are served as-is; photos get optimised. */
export function ProductImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const unoptimized = props.unoptimized ?? (src.endsWith(".svg") || src.startsWith("/api/demo-uploads/"));
  // eslint-disable-next-line jsx-a11y/alt-text
  return <Image {...props} unoptimized={unoptimized} />;
}
