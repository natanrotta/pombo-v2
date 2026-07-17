import { Suspense, lazy } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import type { TimeFieldProps } from "./TimeFieldPicker";

export type { TimeFieldProps } from "./TimeFieldPicker";

// Same on-demand split as DateField — see the comment there.
const TimeFieldPicker = lazy(() => import("./TimeFieldPicker"));

function TimeFieldFallback({ label, error, placeholder }: TimeFieldProps) {
  return (
    <FormControl isInvalid={Boolean(error)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Input placeholder={placeholder} isDisabled cursor="pointer" />
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </FormControl>
  );
}

export function TimeField(props: TimeFieldProps) {
  return (
    <Suspense fallback={<TimeFieldFallback {...props} />}>
      <TimeFieldPicker {...props} />
    </Suspense>
  );
}
