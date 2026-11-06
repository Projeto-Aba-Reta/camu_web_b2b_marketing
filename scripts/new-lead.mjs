// uso: npm run new-lead -- <slug> "<Nome do lead>"
import { cpSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

const [slug, ...rest] = process.argv.slice(2);
const name = rest.join(" ").trim();
if (!slug || !name || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('uso: npm run new-lead -- <slug-minusculo> "<Nome do lead>"');
  process.exit(1);
}

const root = process.cwd();
const dest = path.join(root, "src/leads", slug);
if (existsSync(dest)) { console.error(`já existe: src/leads/${slug}`); process.exit(1); }

cpSync(path.join(root, "src/leads/_template"), dest, { recursive: true });
for (const f of readdirSync(dest)) {
  const p = path.join(dest, f);
  writeFileSync(p, readFileSync(p, "utf8").replaceAll("__SLUG__", slug).replaceAll("__NAME__", name));
}

const reg = path.join(root, "src/leads/index.ts");
const id = "lead_" + slug.replaceAll("-", "_");
let src = readFileSync(reg, "utf8");
src = src.replace("// @leads:import", `import ${id} from "./${slug}";\n// @leads:import`);
src = src.replace("// @leads:register", `${id},\n  // @leads:register`);
writeFileSync(reg, src);

console.log(`✔ lead criado: src/leads/${slug}/index.ts  →  http://localhost:3000/p/${slug}`);
