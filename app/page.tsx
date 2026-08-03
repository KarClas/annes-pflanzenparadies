import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gartenLaden } from '@/lib/garten/laden';
import { darfSchreiben } from '@/lib/auth';
import GartenAnsicht from './garten-ansicht';

// Der Garten ändert sich, sobald etwas eingetragen wird — die Seite wird
// deshalb bei jedem Aufruf frisch aus der Datenbank gebaut.
export const dynamic = 'force-dynamic';

/** Welche Fotos liegen tatsächlich im Projekt? */
function vorhandeneFotos() {
  try {
    return readdirSync(join(process.cwd(), 'public', 'fotos'))
      .filter((d) => d.endsWith('_klein.jpg'))
      .map((d) => d.replace(/_klein\.jpg$/, ''));
  } catch {
    return [];
  }
}

export default async function Seite() {
  const [garten, schreiben] = await Promise.all([gartenLaden(), darfSchreiben()]);

  return (
    <GartenAnsicht
      garten={{ pflanzen: garten.pflanzen, pflege: garten.pflege, ernten: garten.ernten }}
      thema={garten.thema}
      standort={garten.standort}
      fotos={vorhandeneFotos()}
      darfSchreiben={schreiben}
    />
  );
}
