// Only allow printable ASCII characters (blocks Bangla & non-English scripts)
export const isEnglishOnly = (value) => /^[\x20-\x7E]*$/.test(value);

export const DEFAULT_SETTINGS = {
  farewellDate: "2027-02-20T10:00",
  notice:
    "Welcome to Masters Farewell! Please keep your payment receipt safe. Venue and detailed schedule will be announced soon.",
  categories: [
    {
      id: "cat_1",
      label: "প্রোগ্রামে অংশগ্রহণ + গাউন সেট + গিফট",
      labelEn: "Program + Gown Set + Gift",
      amount: 3000,
    },
    {
      id: "cat_2",
      label: "প্রোগ্রামে অংশগ্রহণ + গাউন (গিফট থাকবে না)",
      labelEn: "Program + Gown (No Gift)",
      amount: 2500,
    },
    {
      id: "cat_3",
      label: "শুধু গিফট + ফেয়ারওয়েল টুপি,স্টোল (অনুষ্ঠানে অংশগ্রহন করবো না)",
      labelEn: "Gift + Farewell Cap & Stole Only (Not Attending)",
      amount: 2000,
    },
  ],
};

// Convert remote image URL to resized Base64 DataURL for jsPDF
export async function imageUrlToBase64(url) {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 90;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        const scale = Math.max(size / img.width, size / img.height);
        const x = size / 2 - (img.width / 2) * scale;
        const y = size / 2 - (img.height / 2) * scale;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
}
