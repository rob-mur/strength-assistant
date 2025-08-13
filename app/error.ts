import { setJSExceptionHandler } from "react-native-exception-handler";

const errorHandler = (e: Error, _: boolean) => {
  if (__DEV__) {
    console.log(`Fatal error: ${e}`);
    throw e;
  }
};

export default function handleErrors() {
  setJSExceptionHandler(errorHandler, true);
}
