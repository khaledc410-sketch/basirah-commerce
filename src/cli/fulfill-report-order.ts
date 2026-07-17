import { parseArgs } from "node:util";

import { isDemoMode } from "@/config/env";
import { closeDb } from "@/db/client";
import { AcquisitionError } from "@/modules/acquisition/errors";
import {
  fulfillPaidReport,
  fulfillPaidReportInputSchema,
} from "@/modules/reports/paid-report-fulfillment";

async function main() {
  if (isDemoMode()) {
    throw new AcquisitionError(
      "INVALID_ORDER_STATE",
      409,
      "تنفيذ التقارير المدفوعة معطل في وضع العرض. استخدم staging أو production.",
    );
  }
  const { values } = parseArgs({
    allowPositionals: false,
    options: {
      order: { type: "string" },
      "payment-reference": { type: "string" },
      confirm: { type: "boolean", default: false },
    },
  });
  if (!values.confirm) {
    throw new AcquisitionError(
      "INVALID_REQUEST",
      400,
      "أضف --confirm بعد التحقق من استلام الدفع الخارجي.",
    );
  }
  const parsed = fulfillPaidReportInputSchema.safeParse({
    orderId: values.order,
    paymentReference: values["payment-reference"],
  });
  if (!parsed.success) {
    throw new AcquisitionError(
      "INVALID_REQUEST",
      400,
      "استخدم --order بمعرّف UUID صالح و--payment-reference بمرجع دفع خارجي صالح.",
    );
  }
  const result = await fulfillPaidReport(parsed.data);
  process.stdout.write(
    `${JSON.stringify(
      {
        orderId: result.orderId,
        reportId: result.reportId,
        status: result.status,
        newlyFulfilled: result.newlyFulfilled,
        accessLevel: result.accessLevel,
        narrativeSource: result.narrativeSource,
        modelId: result.modelId,
        expiresAt: result.expiresAt,
      },
      null,
      2,
    )}\n`,
  );
}

try {
  await main();
} catch (error) {
  const output =
    error instanceof AcquisitionError
      ? { error: { code: error.code, message: error.publicMessage } }
      : {
          error: {
            code: "FULFILLMENT_FAILED",
            message: "تعذر تنفيذ التقرير. راجع السجلات المترابطة قبل إعادة المحاولة.",
          },
        };
  process.stderr.write(`${JSON.stringify(output)}\n`);
  process.exitCode = 1;
} finally {
  await closeDb();
}
