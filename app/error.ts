import { setJSExceptionHandler } from "react-native-exception-handler";

import { Logger } from "@/lib/data/supabase/supabase/logger";
import { initializeErrorHandling } from "@/lib/utils/logging/LoggingServiceFactory";

// Initialize error handling system
const { errorHandler: globalErrorHandler, userErrorDisplay } =
  initializeErrorHandling();

const errorHandler = (e: Error, isFatal: boolean) => {
  // Use our new global error handler
  globalErrorHandler.handleUncaughtError(
    e,
    isFatal ? "fatal-js-error" : "js-error",
  );

  // Keep existing logger for backward compatibility
  if (__DEV__) {
    const logger = new Logger("ErrorHandler");
    logger.error(`Fatal error: ${e}`, {
      service: "Error Handler",
      platform: "React Native",
      operation: "fatal_error",
    });
    throw e;
  } else {
    // In production, show user-friendly error message
    userErrorDisplay
      .showGenericError("application", false)
      .catch(() => console.error("Failed to show error to user"));
  }
};

export default function handleErrors() {
  setJSExceptionHandler(errorHandler, true);
}
