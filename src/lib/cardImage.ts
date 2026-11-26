// Turns poem cards into real pictures (1080 × 1350, the size Instagram and TikTok photo posts use).
// On phones it opens the share sheet (Save Image, TikTok, WhatsApp…); on computers it downloads the files.

const WIDTH = 1080;

async function render(node: HTMLElement): Promise<Blob> {
  const { toBlob } = await import("html-to-image"); // loaded only when someone saves a picture
  await document.fonts.ready;
  const blob = await toBlob(node, { pixelRatio: WIDTH / node.offsetWidth, cacheBust: true });
  if (!blob) throw new Error("Could not make the picture.");
  return blob;
}

export const pictureName = (title: string, n: number, of: number) =>
  `${(title || "poem").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "poem"}${of > 1 ? `-${n}` : ""}.png`;

/** Saves cards as pictures (one file per card). Returns "shared", "downloaded" or "cancelled". */
export async function saveCardPictures(cards: { node: HTMLElement; name: string }[]): Promise<"shared" | "downloaded" | "cancelled"> {
  const files: File[] = [];
  for (const c of cards) files.push(new File([await render(c.node)], c.name, { type: "image/png" }));
  const touch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  if (touch && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files });
      return "shared";
    } catch {
      return "cancelled";
    }
  }
  for (const f of files) {
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    await new Promise((r) => setTimeout(r, 300)); // browsers can drop downloads fired all at once
  }
  return "downloaded";
}
