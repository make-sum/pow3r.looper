const fs = require("fs");
const path = require("path");
function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");
      let changed = false;
      if (content.includes('import.meta.env.VITE_GEMINI_API_KEY || "dummy"')) {
        content = content.replace(/import.meta.env.VITE_GEMINI_API_KEY \|\| "dummy"/g, "import.meta.env.VITE_GEMINI_API_KEY as string");
        changed = true;
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, "utf8");
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}
replaceInDir("src");
