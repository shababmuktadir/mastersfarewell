export const CLOUDINARY_CLOUD_NAME = "do1dejkkk";
export const CLOUDINARY_UPLOAD_PRESET = "mastersfarewell";

export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file selected");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Cloudinary image upload failed");
  }

  const data = await response.json();
  return data.secure_url;
}
