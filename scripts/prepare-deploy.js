const { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } = require("fs");
const { execSync } = require("child_process");
const { join } = require("path");

const root = join(__dirname, "..");
const dest = join(root, ".azure-deploy");

// Clean and create staging directory
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

// Copy deployment artifacts
cpSync(join(root, "dist"), join(dest, "dist"), { recursive: true });

// Copy host.json and package-lock.json as-is
const filesToCopy = ["host.json", "package-lock.json"];
for (const file of filesToCopy) {
  cpSync(join(root, file), join(dest, file));
}

// Write a deployment-safe package.json (no build scripts, no devDependencies)
// This prevents Oryx from attempting to run tsc during server-side build
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
delete pkg.scripts;
delete pkg.devDependencies;
writeFileSync(join(dest, "package.json"), JSON.stringify(pkg, null, 2) + "\n");

// Install production dependencies only
execSync("npm ci --omit=dev", { cwd: dest, stdio: "inherit" });
