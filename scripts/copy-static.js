const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`copied: ${src} -> ${dest}`);
}

// prepare manifest.json: if referenced icon files don't exist, remove those entries
const manifestPath = path.join(root, "manifest.json");
if (fs.existsSync(manifestPath)) {
  const manifestRaw = fs.readFileSync(manifestPath, "utf8");
  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
  } catch (e) {
    console.error("failed to parse manifest.json:", e.message);
    // fallback: copy original manifest
    copyFile(manifestPath, path.join(dist, "manifest.json"));
    manifest = null;
  }

  if (manifest) {
    const iconsSrc = path.join(root, "icons");

    function checkAndPruneIconEntry(iconPath) {
      // iconPath can be like 'icons/icon16.png'
      if (!iconPath) return false;
      const absolute = path.join(root, iconPath);
      return fs.existsSync(absolute);
    }

    // prune action.default_icon if some files missing
    if (
      manifest.action &&
      manifest.action.default_icon &&
      typeof manifest.action.default_icon === "object"
    ) {
      const keys = Object.keys(manifest.action.default_icon);
      for (const k of keys) {
        const p = manifest.action.default_icon[k];
        if (!checkAndPruneIconEntry(p)) {
          console.log(
            `icon missing: ${p} (removing entry in action.default_icon)`
          );
          delete manifest.action.default_icon[k];
        }
      }
      if (Object.keys(manifest.action.default_icon).length === 0) {
        delete manifest.action.default_icon;
      }
    }

    // prune icons map
    if (manifest.icons && typeof manifest.icons === "object") {
      const keys = Object.keys(manifest.icons);
      for (const k of keys) {
        const p = manifest.icons[k];
        if (!checkAndPruneIconEntry(p)) {
          console.log(`icon missing: ${p} (removing entry in icons)`);
          delete manifest.icons[k];
        }
      }
      if (Object.keys(manifest.icons).length === 0) {
        delete manifest.icons;
      }
    }

    // write adjusted manifest to dist
    fs.mkdirSync(dist, { recursive: true });
    fs.writeFileSync(
      path.join(dist, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
    console.log("wrote adjusted manifest.json to dist");
  }
} else {
  console.warn("manifest.json not found in root");
}
// copy background
copyFile(path.join(root, "background.js"), path.join(dist, "background.js"));

// copy icons folder if exists
const iconsSrc = path.join(root, "icons");
const iconsDest = path.join(dist, "icons");
if (fs.existsSync(iconsSrc)) {
  const files = fs.readdirSync(iconsSrc);
  for (const f of files) {
    copyFile(path.join(iconsSrc, f), path.join(iconsDest, f));
  }
}

// copy _locales folder if exists
const localesSrc = path.join(root, "_locales");
const localesDest = path.join(dist, "_locales");
if (fs.existsSync(localesSrc)) {
  const locales = fs.readdirSync(localesSrc);
  for (const locale of locales) {
    const localeSrc = path.join(localesSrc, locale);
    const localeDest = path.join(localesDest, locale);
    if (fs.statSync(localeSrc).isDirectory()) {
      fs.mkdirSync(localeDest, { recursive: true });
      const files = fs.readdirSync(localeSrc);
      for (const f of files) {
        copyFile(path.join(localeSrc, f), path.join(localeDest, f));
      }
    }
  }
}

console.log("copy-static complete");
