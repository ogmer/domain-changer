const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "icons");

const targets = [16, 48, 128];

async function generate() {
  if (!fs.existsSync(iconsDir)) {
    console.error("icons directory not found");
    process.exit(1);
  }

  for (const size of targets) {
    const svgPath = path.join(iconsDir, `icon${size}.svg`);
    const pngPath = path.join(iconsDir, `icon${size}.png`);
    const altPng1 = path.join(iconsDir, `icon_${size}.png`);
    const altPng2 = path.join(iconsDir, `icon${size}.png`);

    // if target already exists, skip
    if (fs.existsSync(pngPath)) {
      console.log(`exists: ${pngPath}`);
      continue;
    }

    if (fs.existsSync(svgPath)) {
      const svgBuffer = fs.readFileSync(svgPath);
      try {
        // Render SVG to PNG with transparent background and maximum compression
        const img = sharp(svgBuffer)
          .resize(size, size, { fit: "contain" })
          .png({ compressionLevel: 9, adaptiveFiltering: true, force: true });
        await img.toFile(pngPath);
        console.log(`generated from svg: ${pngPath}`);
        continue;
      } catch (e) {
        console.error(`failed to generate ${pngPath} from svg:`, e.message);
      }
    }

    // If SVG not available, try to copy an existing PNG with alternate names
    if (fs.existsSync(altPng1)) {
      fs.copyFileSync(altPng1, pngPath);
      console.log(`copied ${altPng1} -> ${pngPath}`);
      continue;
    }

    if (fs.existsSync(altPng2)) {
      // altPng2 may be the same as pngPath; if it's identical we already continued above
      fs.copyFileSync(altPng2, pngPath);
      console.log(`copied ${altPng2} -> ${pngPath}`);
      continue;
    }

    console.warn(
      `no source for icon ${size}: expected ${svgPath} or ${altPng1}`
    );
  }
}

generate();
