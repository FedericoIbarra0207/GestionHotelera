import fs from "fs";
import path from "path";

const __dirname = path.resolve();

// Carpetas donde buscamos rutas
const folders = [
    "src/habitaciones",
    "src/reservas",
    "src/pagos",
    "src/consumos",
    "src/disponibilidades",
    "src/users",
    "src/routes"
];

// Palabras a reemplazar
const replacements = [
    { from: "requireRole", to: "roleMiddleware" }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    let changed = false;

    replacements.forEach(r => {
        if (content.includes(r.from)) {
            content = content.replace(new RegExp(r.from, "g"), r.to);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(filePath, content, "utf8");
        console.log("✔ Reemplazado en:", filePath);
    }
}

function scanFolder(folder) {
    const fullPath = path.join(__dirname, folder);

    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath);

    for (const f of files) {
        const filePath = path.join(fullPath, f);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            scanFolder(filePath);
        } else if (filePath.endsWith(".js")) {
            processFile(filePath);
        }
    }
}

// Ejecutar reemplazo
console.log("🔎 Buscando archivos con requireRole...");
folders.forEach(scanFolder);
console.log("✅ Reemplazo completado.");
