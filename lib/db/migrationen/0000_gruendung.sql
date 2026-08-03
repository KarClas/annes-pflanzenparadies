CREATE TABLE "aktivitaeten" (
	"id" serial PRIMARY KEY NOT NULL,
	"pflanze_id" text NOT NULL,
	"art" text NOT NULL,
	"zeitpunkt" timestamp with time zone NOT NULL,
	"notiz" text,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "basis_pflege" (
	"pflanze_id" text PRIMARY KEY NOT NULL,
	"n_gegossen" integer DEFAULT 0 NOT NULL,
	"n_geduengt" integer DEFAULT 0 NOT NULL,
	"quelle" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "einstellungen" (
	"schluessel" text PRIMARY KEY NOT NULL,
	"wert" jsonb NOT NULL,
	"geaendert_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ernten" (
	"id" bigint PRIMARY KEY NOT NULL,
	"pflanze_id" text NOT NULL,
	"datum" date NOT NULL,
	"menge" text,
	"notiz" text,
	"erfasst_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pflanzen" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"standort" text NOT NULL,
	"kategorie" text NOT NULL,
	"anzahl" integer DEFAULT 1 NOT NULL,
	"giessen" text,
	"giess_intervall_tage" integer,
	"giess_hinweis" text,
	"duengen" text,
	"duenger" text,
	"duenge_intervall_tage" integer,
	"duenge_hinweis" text,
	"licht" text,
	"erde" text,
	"mehrjaehrig" boolean DEFAULT false NOT NULL,
	"winterhart" boolean DEFAULT false NOT NULL,
	"notizen" text,
	"foto" text,
	"darstellung" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"angelegt_am" timestamp with time zone DEFAULT now() NOT NULL,
	"geaendert_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "aktivitaeten" ADD CONSTRAINT "aktivitaeten_pflanze_id_pflanzen_id_fk" FOREIGN KEY ("pflanze_id") REFERENCES "public"."pflanzen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "basis_pflege" ADD CONSTRAINT "basis_pflege_pflanze_id_pflanzen_id_fk" FOREIGN KEY ("pflanze_id") REFERENCES "public"."pflanzen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ernten" ADD CONSTRAINT "ernten_pflanze_id_pflanzen_id_fk" FOREIGN KEY ("pflanze_id") REFERENCES "public"."pflanzen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "aktivitaeten_pflanze_art_idx" ON "aktivitaeten" USING btree ("pflanze_id","art","zeitpunkt");--> statement-breakpoint
CREATE INDEX "ernten_datum_idx" ON "ernten" USING btree ("datum");