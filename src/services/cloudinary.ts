
export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = "db2udbkue"; 
  const preset = "Catalogo_Distrimaq"; // El que creaste como 'Unsigned'

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Error al subir a Cloudinary");

  const data = await res.json();
  return data.secure_url; // Retorna el link de la imagen
};