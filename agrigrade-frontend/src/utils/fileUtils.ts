/**
 * Helper utility to read uploaded files into persistent Data URLs (base64)
 * so that user-uploaded previews do not expire after session reload.
 */

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        resolve(URL.createObjectURL(file));
      }
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  });
}
