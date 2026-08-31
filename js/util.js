// Ícono gris genérico para premios sin foto configurada.
export const SIN_IMAGEN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<rect width="100" height="100" fill="#cccccc"/>' +
      '<text x="50" y="66" font-size="55" text-anchor="middle" fill="#777777" font-family="Arial">🎁</text>' +
      "</svg>",
  );

// Convierte un archivo de imagen elegido por el usuario en un data URL
// (base64) para guardarlo directo en el documento de premio.
//
// Se reduce a un ícono chico (máx. 300px de lado) y se comprime, porque:
// - en modo local, localStorage solo tiene ~5-10MB de espacio total
// - en Firestore, cada documento tiene un límite duro de 1MB
// Una foto de celular sin procesar (varios MB) rompía ambos límites.
export function archivoABase64(file, maxLado = 300, calidad = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxLado || height > maxLado) {
          const factor = maxLado / Math.max(width, height);
          width = Math.round(width * factor);
          height = Math.round(height * factor);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", calidad));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
