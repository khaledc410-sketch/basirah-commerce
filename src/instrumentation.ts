import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { initializeTelemetry } = await import("./lib/telemetry/runtime");
  await initializeTelemetry();
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportNextRequestError } = await import("./lib/telemetry/runtime");
  reportNextRequestError(error, request, context);
};
