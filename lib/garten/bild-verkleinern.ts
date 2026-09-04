/**
 * Bilder im Browser verkleinern, bevor sie hochgeladen werden.
 *
 * Ein Handyfoto hat leicht 4 MB. Für den Wachstumsverlauf reicht ein Bruchteil
 * davon, und was gar nicht erst hochgeladen wird, kostet weder Datenvolumen
 * noch Platz in der Datenbank.
 *
 * Läuft nur im Browser.
 */

export type VerkleinertesBild = {
  gross: Blob;
  klein: Blob;
  breite: number;
  hoehe: number;
};

/** Längste Kante des großen Bildes bzw. der Vorschau. */
const KANTE_GROSS = 1600;
const KANTE_KLEIN = 240;
const GUETE = 0.82;

async function zeichnen(bild: ImageBitmap, maxKante: number, guete: number) {
  const faktor = Math.min(1, maxKante / Math.max(bild.width, bild.height));
  const breite = Math.round(bild.width * faktor);
  const hoehe = Math.round(bild.height * faktor);

  const flaeche = document.createElement('canvas');
  flaeche.width = breite;
  flaeche.height = hoehe;
  const stift = flaeche.getContext('2d');
  if (!stift) throw new Error('Der Browser kann das Bild nicht verarbeiten.');
  stift.imageSmoothingQuality = 'high';
  stift.drawImage(bild, 0, 0, breite, hoehe);

  const umwandeln = (typ: string) =>
    new Promise<Blob | null>((fertig) => flaeche.toBlob(fertig, typ, guete));

  /**
   * WebP zuerst: bei gleicher sichtbarer Güte rund ein Drittel kleiner als
   * JPEG. Kann ein Browser es nicht erzeugen, liefert `toBlob` stillschweigend
   * PNG zurück — das wäre um ein Vielfaches größer. Deshalb wird der Typ
   * geprüft und im Zweifel auf JPEG zurückgefallen, statt es zu glauben.
   */
  let blob = await umwandeln('image/webp');
  if (blob?.type !== 'image/webp') {
    blob = await umwandeln('image/jpeg');
  }
  if (!blob) throw new Error('Das Bild ließ sich nicht umwandeln.');
  return { blob, breite, hoehe };
}

export async function verkleinern(datei: File): Promise<VerkleinertesBild> {
  // `from-image` beachtet die Drehinformation aus der Kamera — sonst liegen
  // Hochkantfotos vom Handy quer.
  const bild = await createImageBitmap(datei, { imageOrientation: 'from-image' });
  try {
    const gross = await zeichnen(bild, KANTE_GROSS, GUETE);
    const klein = await zeichnen(bild, KANTE_KLEIN, 0.75);
    return {
      gross: gross.blob,
      klein: klein.blob,
      breite: gross.breite,
      hoehe: gross.hoehe,
    };
  } finally {
    bild.close();
  }
}

/** „2,4 MB" statt „2516582" — für die Rückmeldung an Anne. */
export function groesse(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}
