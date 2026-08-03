import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const kennung = process.env.AUTH_GITHUB_ID;
const geheimnis = process.env.AUTH_GITHUB_SECRET;

/** Ohne hinterlegte GitHub-Zugangsdaten läuft die App im Nur-Lesen-Betrieb. */
export const githubEingerichtet = Boolean(kennung && geheimnis);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: githubEingerichtet
    ? [GitHub({ clientId: kennung, clientSecret: geheimnis })]
    : [],
  callbacks: {
    // Den GitHub-Benutzernamen mitführen — die E-Mail taugt nicht als Kennung,
    // weil sie bei GitHub privat sein kann und dann fehlt.
    async jwt({ token, profile }) {
      if (profile?.login) token.login = profile.login as string;
      return token;
    },
    async session({ session, token }) {
      if (token.login) (session.user as { login?: string }).login = token.login as string;
      return session;
    },
  },
});

/**
 * Darf der aktuelle Besucher etwas eintragen?
 *
 * Nur Annes GitHub-Konto darf schreiben; alle anderen sehen den Garten im
 * Lesemodus. **In jeder schreibenden Server-Aktion aufrufen** — Server-Aktionen
 * sind über POST direkt erreichbar, ausgeblendete Knöpfe schützen nichts.
 */
export async function darfSchreiben(): Promise<boolean> {
  const besitzer = process.env.GARTEN_BESITZER;

  // Zugang für die lokale Entwicklung: greift ausschließlich beim Arbeiten am
  // eigenen Rechner. Auf Vercel ist NODE_ENV immer 'production', der Zweig ist
  // dort also nicht erreichbar — auch nicht, wenn die Variable versehentlich
  // gesetzt wäre.
  if (process.env.NODE_ENV === 'development' && process.env.GARTEN_OFFEN_LOKAL === 'ja') {
    return true;
  }

  if (!besitzer || !githubEingerichtet) return false;

  const sitzung = await auth();
  const angemeldet = (sitzung?.user as { login?: string } | undefined)?.login;
  return angemeldet?.toLowerCase() === besitzer.toLowerCase();
}
