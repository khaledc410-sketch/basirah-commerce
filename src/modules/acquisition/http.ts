import { AcquisitionError } from "./errors";

export async function readBoundedJson(request: Request, maxBytes = 4_096): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/json") {
    throw new AcquisitionError(
      "INVALID_CONTENT_TYPE",
      415,
      "يجب إرسال الطلب بصيغة JSON.",
    );
  }

  const declaredLengthHeader = request.headers.get("content-length");
  if (declaredLengthHeader) {
    const declaredLength = Number(declaredLengthHeader);
    if (!Number.isFinite(declaredLength) || declaredLength < 0) {
      throw new AcquisitionError("INVALID_REQUEST", 400, "حجم الطلب غير صالح.");
    }
    if (declaredLength > maxBytes) {
      throw new AcquisitionError(
        "REQUEST_TOO_LARGE",
        413,
        "حجم الطلب أكبر من الحد المسموح.",
      );
    }
  }

  if (!request.body) {
    throw new AcquisitionError("INVALID_JSON", 400, "تعذر قراءة بيانات الطلب.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let totalBytes = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new AcquisitionError(
          "REQUEST_TOO_LARGE",
          413,
          "حجم الطلب أكبر من الحد المسموح.",
        );
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch (error) {
    if (error instanceof AcquisitionError) throw error;
    throw new AcquisitionError("INVALID_JSON", 400, "تعذر قراءة بيانات الطلب.");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AcquisitionError("INVALID_JSON", 400, "تعذر قراءة بيانات الطلب.");
  }
}
export function acquisitionJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("cache-control", "no-store");
  return Response.json(body, { ...init, headers });
}

export function acquisitionErrorResponse(error: unknown) {
  if (error instanceof AcquisitionError) {
    return acquisitionJson(
      { error: { code: error.code, message: error.publicMessage } },
      { status: error.status },
    );
  }
  return acquisitionJson(
    {
      error: {
        code: "ACQUISITION_UNAVAILABLE",
        message: "تعذر إكمال الطلب الآن. حاول مجددًا لاحقًا.",
      },
    },
    { status: 500 },
  );
}
