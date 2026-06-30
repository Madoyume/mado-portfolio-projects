type UploadOptions = { folder?: string; publicId?: string };

export async function uploadToCloudinary(
  file: File,
  options: UploadOptions = {},
) {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!signRes.ok) throw new Error("failed to sign upload");
  const { cloudName, apiKey, timestamp, signature, folder, publicId } =
    await signRes.json();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  if (folder) form.append("folder", folder);
  if (publicId) form.append("public_id", publicId);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form },
  );
  if (!uploadRes.ok) throw new Error("failed to upload");
  const data = await uploadRes.json();

  return {
    url: data.secure_url as string,
    publicId: data.public_id as string,
    width: data.width as number,
    height: data.height as number,
  };
}
