CREATE TABLE "fotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"pflanze_id" text,
	"daten" "bytea" NOT NULL,
	"typ" text DEFAULT 'image/jpeg' NOT NULL,
	"breite" integer,
	"hoehe" integer,
	"aufgenommen_am" date,
	"notiz" text,
	"hochgeladen_am" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_pflanze_id_pflanzen_id_fk" FOREIGN KEY ("pflanze_id") REFERENCES "public"."pflanzen"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fotos_pflanze_idx" ON "fotos" USING btree ("pflanze_id","aufgenommen_am");