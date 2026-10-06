// SSR-safe interop wrapper for react-countup (CJS default export)
import * as CountUpModule from "react-countup";
import type { ComponentProps, ComponentType } from "react";

type CountUpComponent = ComponentType<{
  end: number;
  duration?: number;
  separator?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  preserveValue?: boolean;
}>;

const raw = CountUpModule as unknown as {
  default?: CountUpComponent | { default?: CountUpComponent };
};
const resolved =
  (typeof raw.default === "function"
    ? raw.default
    : (raw.default as { default?: CountUpComponent } | undefined)?.default) ??
  (CountUpModule as unknown as CountUpComponent);

export const CountUp = resolved as CountUpComponent;
export type CountUpProps = ComponentProps<typeof CountUp>;
export default CountUp;
