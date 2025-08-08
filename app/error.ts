import { setJSExceptionHandler } from "react-native-exception-handler";

const errorHandler = (e: Error, isFatal: boolean) => {
  if (__DEV__) {
    throw e;
  }
};

export default function handleErrors() {
  setJSExceptionHandler(errorHandler, true);
}
