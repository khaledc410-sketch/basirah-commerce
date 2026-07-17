import fs from "node:fs/promises";
import { prospects } from "./campaign-data.mjs";

const output = prospects.map((p) => ({
  slug: p.slug,
  storeName: p.name,
  assistantName: p.assistant,
  subtitle: "الظهور والمحتوى والمبيعات في مسار واحد",
  primary: p.primary,
  accent: p.accent,
  welcome: `أهلًا بك في ${p.name}. أساعدك في الاختيار من بيانات المتجر والمنتجات المتوفرة فقط.`,
  chips: p.chips,
  userQuestion: p.question,
  botReply: p.reply,
  action: p.action,
}));

if (output.length !== 50) {
  throw new Error(`Expected 50 prospects, received ${output.length}`);
}

await fs.writeFile(new URL("./bot-mockups-50.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Prepared ${output.length} store-specific bot previews.`);
