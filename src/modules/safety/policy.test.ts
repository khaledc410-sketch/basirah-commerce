import { describe, expect, it } from "vitest";

import { demoProducts } from "@/core/demo/seed";
import { advise } from "@/modules/advisor/recommendation";
import { classifySafety } from "@/modules/safety/policy";

describe("category safety policy", () => {
  it.each([
    ["هل هذا مناسب للحامل؟", "pregnancy"],
    ["هل يتداخل مع دواء؟", "medication"],
    ["أبي علاج للأكزيما", "medical"],
    ["عندي حساسية شديدة", "allergy"],
  ])("restricts %s", (message, topic) => {
    const decision = classifySafety(message);
    expect(decision.status).toBe("restricted");
    expect(decision.topic).toBe(topic);
    expect(decision.response).toBeTruthy();
  });

  it("prevents product cards when a sensitive policy is triggered", () => {
    const result = advise("هل المرطب مناسب للحامل؟", demoProducts);
    expect(result.safety.status).toBe("restricted");
    expect(result.products).toHaveLength(0);
    expect(result.assistantText).toContain("لا أستطيع تأكيد ملاءمة المنتج أثناء الحمل");
  });

  it("allows a normal product-discovery question", () => {
    expect(classifySafety("أبي سيروم خفيف للبشرة الدهنية").status).toBe("allowed");
  });
});
