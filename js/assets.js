import { PRODUCTS, CONFIG } from "./config.js";
export async function loadAssets(progress) {
  const images = new Map(),
    missing = [];
  let count = 0;
  const entries = [
    ...PRODUCTS.map((p) => [p.id, p.image]),
    ["bag", CONFIG.bagImage],
    ["bomb", CONFIG.bombImage],
    ["chomper", "assets/skins/howell-chomper.png"],
  ];
  await Promise.all(
    entries.map(
      ([key, url]) =>
        new Promise((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => finish(false), 12000);
          let done = false;
          function finish(ok) {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (ok) images.set(key, img);
            else missing.push(key);
            progress(++count / entries.length);
            resolve();
          }
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          img.src = url;
        }),
    ),
  );
  return { images, missing };
}
export function fitImage(ctx, image, x, y, w, h) {
  if (!image) return;
  const scale = Math.min(w / image.width, h / image.height);
  ctx.drawImage(
    image,
    x + (w - image.width * scale) / 2,
    y + (h - image.height * scale) / 2,
    image.width * scale,
    image.height * scale,
  );
}
