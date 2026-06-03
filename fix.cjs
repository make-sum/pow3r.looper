const fs=require("fs");
let c=fs.readFileSync("src/components/SurfaceView.tsx","utf8");
// Only replace `currentPage.` with `page.` between lines 800 and 1400 where the mapped function is
const lines = c.split('\n');
for (let i = 800; i < 1400; i++) {
  if (lines[i]) {
    lines[i] = lines[i].replace(/currentPage\./g, 'page.');
  }
}
fs.writeFileSync("src/components/SurfaceView.tsx", lines.join('\n'));
