import "server-only";

import { clientAddress, enforceRateLimit } from "@/core/security/rate-limit";

import { AcquisitionError } from "./errors";
import { hashOpaqueToken } from "./security";

export async function enforceAcquisitionRateLimit(input: {
  request: Request;
  namespace: string;
  resource: string;
  limit: number;
  windowSeconds: number;
}) {
  try {
    const result = await enforceRateLimit({
      namespace: input.namespace,
      identifier: `${clientAddress(input.request)}:${hashOpaqueToken(input.resource)}`,
      limit: input.limit,
      windowSeconds: input.windowSeconds,
    });
    if (!result.allowed) {
      throw new AcquisitionError(
        "RATE_LIMITED",
        429,
        "تجاوزت الحد المتاح لهذه العملية. حاول مجددًا لاحقًا.",
      );
    }
    return result;
  } catch (error) {
    if (error instanceof AcquisitionError) throw error;
    throw new AcquisitionError(
      "RATE_LIMIT_UNAVAILABLE",
      503,
      "تعذر التحقق من حد الاستخدام الآن.",
    );
  }
}
