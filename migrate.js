#!/usr/bin/env node
// One-time migration: imports all recipes from recipe-database.json into Supabase.
// Requires Node 18+ (uses built-in fetch).
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
//   node migrate.js

const fs   = require("fs");
const path = require("path");

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  process.exit(1);
}

const dbPath = path.join(__dirname, "recipe-database.json");
const raw    = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const recipes = raw.recipes;

async function run() {
  console.log(`Migrating ${recipes.length} recipes to Supabase...`);
  let ok = 0;
  let fail = 0;

  for (const r of recipes) {
    // Normalise meal to always be an array
    const meal = Array.isArray(r.meal) ? r.meal : (r.meal ? [r.meal] : ["dinner"]);

    const row = {
      id:                    r.id,
      title:                 r.title,
      url:                   r.url || null,
      meal,
      notes:                 r.notes || null,
      ingredients:           r.ingredients || [],
      steps:                 r.steps || [],
      nutrition_per_serving: r.nutrition_per_serving || null,
      status:                "published"
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "apikey":        SERVICE_KEY,
        "Prefer":        "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(row)
    });

    if (res.ok || res.status === 201 || res.status === 204) {
      console.log(`  ✓ ${r.id}`);
      ok++;
    } else {
      const err = await res.text();
      console.error(`  ✗ ${r.id}: ${err}`);
      fail++;
    }
  }

  console.log(`\nDone. ${ok} succeeded, ${fail} failed.`);
}

run().catch(err => { console.error(err); process.exit(1); });
