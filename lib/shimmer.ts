const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#F1F8E9" offset="20%" />
      <stop stop-color="#E0E8D9" offset="50%" />
      <stop stop-color="#F1F8E9" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#F1F8E9" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1.2s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

let cached: string | null = null;
export const blurDataURL = (w = 100, h = 100) => {
  if (w === 100 && h === 100) {
    if (!cached)
      cached = `data:image/svg+xml;base64,${toBase64(shimmer(100, 100))}`;
    return cached;
  }
  return `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
};
