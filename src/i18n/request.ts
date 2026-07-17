import { getRequestConfig } from "next-intl/server";

import { isPublicLocale, publicMessages } from "@/i18n/public";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isPublicLocale(requested) ? requested : "ar";
  return {
    locale,
    messages: publicMessages[locale],
    timeZone: "Asia/Riyadh",
  };
});
