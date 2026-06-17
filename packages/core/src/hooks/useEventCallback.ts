import * as React from 'react';

export function useEventCallback<Args extends unknown[], Return>(
  callback: (...args: Args) => Return
): (...args: Args) => Return {
  const callbackRef = React.useRef(callback);

  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  return React.useCallback((...args: Args) => callbackRef.current(...args), []);
}
