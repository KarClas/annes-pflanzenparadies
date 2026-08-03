import { gartenLaden } from '@/lib/garten/laden';
import { darfSchreiben } from '@/lib/auth';
import GartenAnsicht from './garten-ansicht';

// Der Garten ändert sich, sobald etwas eingetragen wird — die Seite wird
// deshalb bei jedem Aufruf frisch aus der Datenbank gebaut.
export const dynamic = 'force-dynamic';

export default async function Seite() {
  const [garten, schreiben] = await Promise.all([gartenLaden(), darfSchreiben()]);

  return (
    <GartenAnsicht
      garten={{
        pflanzen: garten.pflanzen,
        pflege: garten.pflege,
        ernten: garten.ernten,
        fotos: garten.fotos,
      }}
      thema={garten.thema}
      standort={garten.standort}
      darfSchreiben={schreiben}
    />
  );
}
