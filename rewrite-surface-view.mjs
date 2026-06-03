import fs from "fs";

let content = fs.readFileSync("src/components/SurfaceView.tsx", "utf8");

// Remove the mappings from `) : page.id === "wf_builder" ?` down to `) : (`
const startSearch = ') : page.id === "wf_builder" ? (';
const endSearch = ') : (';

const startIndex = content.indexOf(startSearch);
const endIndex = content.indexOf(endSearch, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + ') : (\n' + content.slice(endIndex + endSearch.length);
  fs.writeFileSync("src/components/SurfaceView.tsx", content, "utf8");
  console.log("Successfully removed the intercepts.");
} else {
  console.log("Could not find the bounds.", startIndex, endIndex);
}
