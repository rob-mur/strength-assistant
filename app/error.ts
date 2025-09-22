import { setJSExceptionHandler } from "react-native-exception-handler";

import { Logger } from "@/lib/data/supabase/supabase/logger";

const errorHandler = (e: Error, _: boolean) => {
  if (__DEV__) {
    const logger = new Logger("ErrorHandler");
    logger.error(`Fatal error: ${e}`, {
      service: "Error Handler",
      platform: "React Native",
      operation: "fatal_error",
    });
    throw e;
  }
};

export default function handleErrors() {
  setJSExceptionHandler(errorHandler, true);
}
