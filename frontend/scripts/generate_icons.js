
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// Script is in frontend/scripts
const PROJECT_ROOT = path.join(__dirname, '..'); // frontend

const SOURCE_IMAGE_PATH = path.join(PROJECT_ROOT, 'public', 'logo.png');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const ICONS_DIR = path.join(PROJECT_ROOT, 'public', 'icons');

// Public logos (Webp)
const PUBLIC_LOGOS = [
    { name: 'icon-192.webp', size: 192 },
    { name: 'icon-512.webp', size: 512 },
];

// Icons (WebP)
const ICON_SIZES = [48, 72, 96, 128, 192, 256, 512];

async function generateLogos() {
    try {
        if (!fs.existsSync(SOURCE_IMAGE_PATH)) {
            console.error(`Error: Source image not found at ${SOURCE_IMAGE_PATH}`);
            return;
        }

        console.log(`Loaded source image from ${SOURCE_IMAGE_PATH}`);

        // Ensure directories exist
        if (!fs.existsSync(PUBLIC_DIR)) {
            fs.mkdirSync(PUBLIC_DIR, { recursive: true });
            console.log(`Created directory: ${PUBLIC_DIR}`);
        }

        if (!fs.existsSync(ICONS_DIR)) {
            fs.mkdirSync(ICONS_DIR, { recursive: true });
            console.log(`Created directory: ${ICONS_DIR}`);
        }

        console.log("Generating public logos...");
        for (const logo of PUBLIC_LOGOS) {
            const outputPath = path.join(PUBLIC_DIR, logo.name);

            await sharp(SOURCE_IMAGE_PATH)
                .resize(logo.size, logo.size)
                .webp()
                .toFile(outputPath);

            console.log(`Saved ${logo.name} to ${outputPath}`);
        }

        console.log("Generating icons...");
        for (const size of ICON_SIZES) {
            const outputFilename = `icon-${size}.webp`;
            const outputPath = path.join(ICONS_DIR, outputFilename);

            await sharp(SOURCE_IMAGE_PATH)
                .resize(size, size)
                .webp()
                .toFile(outputPath);

            console.log(`Saved ${outputFilename} to ${outputPath}`);
        }

        console.log("All images generated successfully.");

    } catch (error) {
        console.error("An error occurred:", error);
    }
}

generateLogos();
