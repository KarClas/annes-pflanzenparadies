/**
 * Ernte-Symbole für die Vitrine — jede geerntete Sorte hat ihr eigenes Zeichen.
 *
 * Wörtlich aus dem Artefakt übernommen (daten/dashboard-original.html,
 * Zeilen 2356–2413). Nicht von Hand abgetippt, sondern herauskopiert.
 */

export const FRUCHT: Record<string, string> = {
  tomate: `<path d="M15 8V5.5" stroke="#4F7038" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="15" cy="18" r="8.6" fill="#C4482F"/>
    <ellipse cx="11.6" cy="14.6" rx="2.6" ry="1.7" fill="#fff" opacity=".3" transform="rotate(-32 11.6 14.6)"/>
    <path d="M15 9.6C11.4 6.6 9.4 8 7.6 6.2 11.6 5.6 13.7 7.5 15 9.6ZM15 9.6c3.6-3 5.6-1.6 7.4-3.4-4-.6-6.1 1.3-7.4 3.4Z" fill="#4F7038"/>`,
  chili: `<path d="M15 7.5c1.6-2 4-2.4 5.6-1.4" stroke="#4F7038" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M15 8c4.4 0 7.2 3.4 6.6 8-.6 4.8-4 8.6-7.4 8.6-2.6 0-4.2-2-3.4-4.6.9-3 2-4.6 2-7.6 0-2.6.9-4.4 2.2-4.4Z" fill="#E08A2E"/>
    <path d="M14.4 11c1.4 1.6 1.8 4.4 1 7.6" stroke="#fff" stroke-width="1.1" opacity=".35" fill="none" stroke-linecap="round"/>`,
  paprika: `<path d="M15 8V5" stroke="#4F7038" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M9 8.6h12" stroke="#4F7038" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 9c-2.4 3-2 8.4.6 11.6 1.4 1.8 3 2.4 4.4 1.6 1.4.8 3 .2 4.4-1.6C22 17.4 22.4 12 20 9Z" fill="#B8443A"/>
    <path d="M12.4 12c-.8 2.6-.4 5.6.8 7.4" stroke="#fff" stroke-width="1.1" opacity=".3" fill="none" stroke-linecap="round"/>`,
  kartoffel: `<ellipse cx="15" cy="16" rx="10" ry="7.2" fill="#A8814F" transform="rotate(-13 15 16)"/>
    <circle cx="11" cy="14" r="1.1" fill="#7C5C34" opacity=".8"/><circle cx="17.5" cy="18" r="1" fill="#7C5C34" opacity=".8"/>
    <circle cx="19" cy="13" r=".8" fill="#7C5C34" opacity=".7"/>
    <ellipse cx="12" cy="12.6" rx="3" ry="1.5" fill="#fff" opacity=".2" transform="rotate(-22 12 12.6)"/>`,
  suesskartoffel: `<path d="M6.5 19c2-5.6 8-10 15-9.6 3 .2 3.6 3 1 5.6-4 4-8.6 6.6-12 6.6-2.6 0-4.4-1-4-2.6Z" fill="#C1703F"/>
    <path d="M10 17c3-2.6 6.6-4.6 10-5.2" stroke="#fff" stroke-width="1.1" opacity=".26" fill="none" stroke-linecap="round"/>`,
  erdbeere: `<path d="M15 8.5V6" stroke="#4F7038" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M10 8.4h10l-2 1.6h-6Z" fill="#4F7038"/>
    <path d="M9.6 11.4c2-1.4 8.8-1.4 10.8 0 .8 5-3 12-5.4 12S8.8 16.4 9.6 11.4Z" fill="#C8394B"/>
    <g fill="#FFE9A8"><circle cx="12.6" cy="14" r=".8"/><circle cx="17.2" cy="14.6" r=".8"/><circle cx="15" cy="17.6" r=".8"/><circle cx="12.8" cy="19.4" r=".7"/><circle cx="17" cy="19.8" r=".7"/></g>`,
  beere: `<path d="M15 9V6" stroke="#4F7038" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="15" cy="17" r="7.6" fill="#9BB84A"/>
    <path d="M15 9.8v14.6M10 12.6c2.6 3 2.6 6.6 0 9.4M20 12.6c-2.6 3-2.6 6.6 0 9.4" stroke="#7A9439" stroke-width=".9" opacity=".8" fill="none"/>
    <ellipse cx="12" cy="13.4" rx="2.2" ry="1.4" fill="#fff" opacity=".3" transform="rotate(-30 12 13.4)"/>`,
  zwiebel: `<path d="M15 8c-1 -2.4 -2.6 -3.4 -4 -3.6M15 8c1-2.4 2.6-3.4 4-3.6" stroke="#8FA85E" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M15 8.4c5 0 8.4 4.4 8.4 8.8 0 4-3.6 6.6-8.4 6.6S6.6 21.2 6.6 17.2c0-4.4 3.4-8.8 8.4-8.8Z" fill="#C9A86B"/>
    <path d="M12 10.6c-1.6 3.4-1.8 8-.6 11.8M18 10.6c1.6 3.4 1.8 8 .6 11.8" stroke="#A8874F" stroke-width=".9" fill="none" opacity=".8"/>`,
  lauch: `<path d="M15 25V13" stroke="#DCE8C6" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M15 14C13 9 10 6.4 7.4 5.6 8.4 10 11.4 13.2 15 14Z" fill="#6E9B53"/>
    <path d="M15 14c2-5 5-7.6 7.6-8.4C21.6 10 18.6 13.2 15 14Z" fill="#5C8746"/>
    <path d="M15 13.4V6.6" stroke="#6E9B53" stroke-width="1.6" stroke-linecap="round"/>`,
  blatt: `<path d="M15 25C15 25 5 20.6 5.6 12 6 6.4 10.6 4 15 4s9 2.4 9.4 8c.6 8.6-9.4 13-9.4 13Z" fill="#6E9B53"/>
    <path d="M15 24V6.4" stroke="#4A7239" stroke-width="1.2"/>
    <path d="M15 11c-2.4-1.6-4.6-2-6.2-1.8M15 11c2.4-1.6 4.6-2 6.2-1.8M15 16c-2.6-1.6-5-2-6.8-1.6M15 16c2.6-1.6 5-2 6.8-1.6" stroke="#4A7239" stroke-width=".9" fill="none" opacity=".8"/>`,
  kraut: `<path d="M15 26V11" stroke="#4A7239" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M15 12c-2.4-3.4-6-4.4-8.4-3.6 1 3.8 4.6 6.2 8.4 5.6ZM15 12c2.4-3.4 6-4.4 8.4-3.6-1 3.8-4.6 6.2-8.4 5.6Z" fill="#6E9B53"/>
    <path d="M15 18c-2-2.6-5-3.4-7-2.8.8 3 3.8 5 7 4.4ZM15 18c2-2.6 5-3.4 7-2.8-.8 3-3.8 5-7 4.4Z" fill="#5C8746"/>
    <path d="M15 8.4c-1.4-1.8-.8-3.6.4-4.4 1.2 1.4 1.4 3.2-.4 4.4Z" fill="#7FA95F"/>`,
  nadel: `<path d="M15 26V6" stroke="#4A7239" stroke-width="1.6" stroke-linecap="round"/>
    <g stroke="#6E9B53" stroke-width="1.5" stroke-linecap="round" fill="none">
      <path d="M15 10 8.6 7M15 10l6.4-3M15 14.4 8.2 12M15 14.4l6.8-2.4M15 18.8 8.6 17M15 18.8l6.4-1.8M15 22.8 9.6 21.6M15 22.8l5.4-1.2"/></g>`,
};

export const FRUCHT_ZU: Record<string, string> = {
  tomaten:'tomate', 'tomaten-2':'tomate', habanero:'chili', paprika:'paprika',
  kartoffeln:'kartoffel', 'kartoffeln-2':'kartoffel',
  suesskartoffel:'suesskartoffel', erdbeeren:'erdbeere', stachelbeere:'beere',
  'kraehen-zwiebeln':'zwiebel', fruehlingszwiebeln:'lauch',
  basilikum:'kraut', 'basilikum-2':'kraut', strauchbasilikum:'kraut',
  koriander:'kraut', kaesekraut:'kraut',
  minze:'blatt', grapefruitminze:'blatt', erdbeerminze:'blatt',
  rucola:'blatt', brassica:'blatt',
  rosmarin:'nadel', zitronenthymian:'nadel',
};

export function fruchtFuer(id: string) {
  return FRUCHT[FRUCHT_ZU[id]] || FRUCHT.blatt;
}
