export {};

declare global {
  interface EventTarget {
    /**
     * File inputs expose a FileList at runtime. Some of this project's current
     * DOM typings narrow event.target to EventTarget without HTMLInputElement
     * members, so keep the runtime-safe optional shape available to TS.
     */
    files?: FileList | null;
  }

  namespace React {
    /** Compatible with React's standard state setter shape. */
    type SetStateAction<S> = S | ((previousState: S) => S);

    /** Compatible with React's standard dispatch function shape. */
    type Dispatch<A> = (value: A) => void;
  }
}
