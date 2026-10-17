import type { Bildquelle } from "../bilder";
import type { Inhalt } from "../inhalt";
import type { Befund } from "../inhalt-pruefen";

/**
 * **Der Vertrag zwischen Verwaltung (`app/admin`) und Server
 * (`app/api/admin/*`)** — seit 2026-10-17.
 *
 * Grundprinzip: Jakob arbeitet nur auf der Webseite; Speichern macht im
 * Hintergrund einen Git-Commit von `lib/inhalt.json` auf `main`. Danach baut
 * Cloudflare wie gewohnt. Die Seite bleibt statisch, jede Änderung steht im
 * Git-Verlauf. Bilder gehen über einen **privaten** Eingangs-Bucket und
 * eine GitHub Action (`.github/workflows/medien.yml`), weil die
 * Bildverarbeitung (`sharp`) im Worker nicht läuft.
 *
 * Alle Routen unter `/api/admin/` und die Seite `/admin` prüfen den Zugang
 * selbst (`lib/admin/zugang.ts`, Passwort und Sitzungs-Cookie).
 * Ohne Einrichtung antworten sie mit 404: Der Admin ist dann schlicht nicht
 * da, statt offen.
 */

/** Was auf dem Server eingerichtet ist — die Oberfläche passt sich an. */
export type Konfiguration = {
  /** `GITHUB_TOKEN` gesetzt: Speichern, Verlauf, Verarbeitung anstoßen. */
  github: boolean;
  /** Eingangs-Bucket gesetzt: Hochladen. */
  eingang: boolean;
};

/** `GET /api/admin/stand` — alles, was die Verwaltung zum Start braucht. */
export type Stand = {
  /** `lib/inhalt.json` von `main` (ohne GitHub: der Stand des Builds). */
  inhalt: Inhalt;
  /**
   * Blob-SHA von `lib/inhalt.json` auf `main` beim Laden. Geht beim
   * Speichern mit — hat sich die Datei inzwischen geändert (Jan im Code,
   * Jakob in einem zweiten Tab), lehnt GitHub den Commit ab (409), und
   * nichts wird still überschrieben. Ohne GitHub: `""`.
   */
  sha: string;
  /** Das Bild-Manifest von `main` — frischer als das des laufenden Builds. */
  bilder: Record<string, Bildquelle>;
  konfiguration: Konfiguration;
  /** Commit, aus dem die laufende Seite gebaut ist, oder `null`. */
  live: string | null;
};

/** `POST /api/admin/speichern` — Body (JSON). */
export type SpeichernAnfrage = {
  inhalt: Inhalt;
  /** `Stand.sha` bzw. die `sha` der letzten erfolgreichen Speicherung. */
  sha: string;
  /** Kurze Beschreibung, wird Teil der Commit-Nachricht. */
  nachricht: string;
};

/** Antwort von `speichern` und `zuruecksetzen`. */
export type SpeichernAntwort =
  | {
      ok: true;
      /** Neue Blob-SHA von `lib/inhalt.json` — Grundlage fürs nächste Speichern. */
      sha: string;
      /** Der neue Commit auf `main`. Sobald `live` ihn meldet, ist er online. */
      commit: string;
      /** Warnungen und Hinweise (Fehler gibt es bei `ok: true` nie). */
      befunde: Befund[];
    }
  | {
      ok: false;
      grund: "konflikt" | "ungueltig" | "nicht-eingerichtet" | "github";
      /** Für Jakob formuliert, auf Deutsch. */
      text: string;
      befunde?: Befund[];
    };

/** Ein Eintrag in `GET /api/admin/verlauf` — Commits, die `lib/inhalt.json` ändern. */
export type VerlaufEintrag = {
  commit: string;
  /** ISO-Zeitpunkt. */
  datum: string;
  autor: string;
  nachricht: string;
};

/** `GET /api/admin/verlauf` */
export type Verlauf = { eintraege: VerlaufEintrag[] };

/** `POST /api/admin/zuruecksetzen` — stellt die Datei aus `commit` als neuen Commit wieder her. */
export type ZuruecksetzenAnfrage = { commit: string; sha: string };

/**
 * `PUT /api/admin/hochladen?ziel=<schluessel>` — Body ist die Bilddatei
 * selbst (kein Formular), `Content-Type` image/jpeg|png|webp|tiff.
 *
 * `ziel` ist der künftige Bildschlüssel und muss einer dieser Formen
 * entsprechen (`ZIEL` unten): `arbeiten/<id>` (Startbild),
 * `arbeiten/<id>/NN`, `ueber/NN`, `film/<id>`, `portrait`. Die Datei landet
 * im **privaten** Eingangs-Bucket als `<ziel>.<endung>`; die Medien-Action
 * entfernt Standort- und andere Metadaten und legt sie nach `original/`.
 * Ein vorhandenes Bild mit demselben Schlüssel wird dabei **ersetzt**.
 */
export type HochladenAntwort = { ok: true; schluessel: string } | { ok: false; text: string };

/** Erlaubte Ziele beim Hochladen. Die id-Regel ist dieselbe wie in `inhalt-pruefen.ts`. */
export const ZIEL =
  /^(arbeiten\/[a-z0-9][a-z0-9-]{0,59}(\/\d{2})?|ueber\/\d{2}|film\/[a-z0-9][a-z0-9-]{0,59}|portrait)$/;

/** Größte Datei beim Hochladen. Der Worker hält sie kurz im Speicher. */
export const MAX_UPLOAD_BYTES = 40 * 1024 * 1024;

/** Erlaubte Bildtypen und ihre Endung im Bucket. */
export const BILDTYPEN: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/tiff": "tif",
};

/** `POST /api/admin/verarbeiten` — stößt die Medien-Action an. */
export type VerarbeitenAntwort = { ok: true } | { ok: false; text: string };

/** Ein Lauf der Medien-Action. */
export type Lauf = {
  id: number;
  /** `queued` | `in_progress` | `completed` … (GitHub) */
  status: string;
  /** `success` | `failure` | … oder `null`, solange er läuft. */
  ergebnis: string | null;
  /** ISO-Zeitpunkt. */
  gestartet: string;
  url: string;
};

/** `GET /api/admin/verarbeitung` */
export type Verarbeitung = {
  /** Schlüssel, die im Eingangs-Bucket auf Verarbeitung warten. */
  wartend: string[];
  /** Die letzten Läufe der Medien-Action, neueste zuerst. */
  laeufe: Lauf[];
};

/** `GET /api/admin/live` — aus welchem Commit die laufende Seite gebaut ist. */
export type Live = { commit: string | null };
