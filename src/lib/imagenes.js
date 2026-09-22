// Reduce las fotos antes de guardarlas: una foto de celular puede pesar 5 MB,
// y se guarda dentro de la tarea (en el dispositivo y en la base de datos).
// A 1280 px y calidad 0.72 queda en ~100-200 KB sin perder legibilidad.

const LADO_MAXIMO = 1280;
const CALIDAD = 0.72;

function leerComoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function comprimirImagen(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL('image/jpeg', CALIDAD);
  } catch {
    return leerComoBase64(file); // si el navegador no puede procesarla, se guarda tal cual
  }
}
