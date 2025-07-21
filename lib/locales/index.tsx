import { I18n } from "i18n-js";

import English from "@/lib/locales/en";

const Locales = new I18n({
  en: English,
});

Locales.enableFallback = true;

export { Locales };
