const fs = require("fs");
const p = "app.js";
let src = fs.readFileSync(p, "utf8");

let changed = 0;

// 1) station 뷰에 external 플래그 추가 (한글은 안 건드리고 url 줄 뒤에만 삽입)
const stationUrlLine = "        url: 'https://newgasstation.vercel.app/',";
const stationUrlLineWithFlag = stationUrlLine + "\n        external: true,";
if (src.includes("external: true")) {
  console.log("[1] ALREADY HAS external flag");
} else if (src.includes(stationUrlLine)) {
  src = src.replace(stationUrlLine, stationUrlLineWithFlag);
  changed++;
  console.log("[1] external flag added OK");
} else {
  console.log("[1] STATION URL LINE NOT FOUND - 중단");
}

// 2) show() 진입부에서 external 뷰는 새 탭으로 열고 함수 종료
const showAnchor = "    function show(id, fromHash) {\n      if (!VIEWS[id]) id = DEFAULT_VIEW;";
const showReplacement =
  "    function show(id, fromHash) {\n" +
  "      if (!VIEWS[id]) id = DEFAULT_VIEW;\n" +
  "      // external modules need first-party cookies (login). Open in a new tab\n" +
  "      // instead of an iframe, where third-party cookies are blocked.\n" +
  "      if (VIEWS[id].external) {\n" +
  "        window.open(VIEWS[id].url, '_blank', 'noopener');\n" +
  "        closeDrawer();\n" +
  "        return;\n" +
  "      }";
if (src.includes("VIEWS[id].external")) {
  console.log("[2] ALREADY HAS external branch");
} else if (src.includes(showAnchor)) {
  src = src.replace(showAnchor, showReplacement);
  changed++;
  console.log("[2] external branch added OK");
} else {
  console.log("[2] show() ANCHOR NOT FOUND - 중단");
}

if (changed > 0) {
  fs.writeFileSync(p, src, { encoding: "utf8" });
  console.log("WROTE app.js (" + changed + " edits)");
} else {
  console.log("NO CHANGES WRITTEN");
}