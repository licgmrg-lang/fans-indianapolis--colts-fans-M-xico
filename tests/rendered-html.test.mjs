import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", host: "localhost" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders Project Horseshoe with production metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Project Horseshoe/);
  assert.match(html, /Colts Fans México/);
  assert.match(html, /og\.png/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships offline support and guarded Firebase rules", async () => {
  const root = new URL("../", import.meta.url);
  const [rules, firebaseClient, app] = await Promise.all([
    readFile(new URL("firestore.rules", root), "utf8"),
    readFile(new URL("app/firebase/client.ts", root), "utf8"),
    readFile(new URL("app/HorseshoeApp.tsx", root), "utf8"),
    access(new URL("public/sw.js", root)),
    access(new URL("storage.rules", root)),
    access(new URL("firestore.indexes.json", root)),
    access(new URL(".env.example", root)),
  ]);

  assert.match(rules, /lic\.gmrg@gmail\.com/);
  assert.match(rules, /allow update, delete: if false/);
  assert.match(rules, /request\.resource\.data\.role == resource\.data\.role/);
  assert.match(rules, /resource\.data\.memberId == request\.auth\.uid/);
  assert.match(rules, /resource\.data\.email != 'lic\.gmrg@gmail\.com'/);
  assert.match(rules, /request\.resource\.data\.role in \['member', 'admin'\]/);
  assert.match(firebaseClient, /where\("status", "==", "approved"\)/);
  assert.match(firebaseClient, /where\("authorId", "==", member\.uid\)/);
  assert.match(firebaseClient, /values\.auditLogs = \[\]/);
  assert.match(app, /subscribeToFirebaseData\(\s*member,/);
  assert.match(app, /Acceso seguro con correo y contraseña/);
  assert.match(app, /Inicia sesión con correo y contraseña para activar la sincronización/);
});
