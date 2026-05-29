import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const js = readFileSync(join(root, "app.js"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");

const checks = [
  ["对接人 placeholder 简短", html.includes('placeholder="对接人"') && !html.includes("创建需求")],
  ["截止日期标签", html.includes("field-label-text") && html.includes("截止日期")],
  ["实习生取消按钮", html.includes('id="cancelInternForm"')],
  ["产品中心收起按钮", html.includes('id="closeProductCenterPanel"')],
  ["导入任务收起按钮", html.includes('id="closeImportPanel"')],
  ["工作时间 workDays", html.includes('name="workDays"') && !html.includes('type="time"')],
  ["保存按钮 btn-save", html.includes('class="btn-save"')],
  ["保存按钮样式不透明", css.includes(".btn-save") && css.includes("opacity: 1")],
  ["closest 切换产品中心", js.includes('closest("#openProductCenterPanel")')],
  ["closest 切换导入", js.includes('closest("#openImportPanel")')],
  ["closest 实习生表单", js.includes('closest("#openInternForm")')],
  ["提交后关闭面板", js.includes("closeTaskPanels()")],
  ["workDays 迁移", js.includes("migrateInternWorkDays")],
  ["toggleTaskPanel", js.includes("function toggleTaskPanel")],
];

let failed = 0;
for (const [name, ok] of checks) {
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status}: ${name}`);
  if (!ok) failed += 1;
}

// 逻辑：toggleTaskPanel 打开时应先关闭其它面板
if (js.includes("if (closeOthers && willOpen) closeTaskPanels()")) {
  console.log("PASS: toggleTaskPanel 互斥逻辑");
} else {
  console.log("FAIL: toggleTaskPanel 互斥逻辑");
  failed += 1;
}

process.exit(failed ? 1 : 0);
