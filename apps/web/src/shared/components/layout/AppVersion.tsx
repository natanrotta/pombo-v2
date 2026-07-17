import { Box, type BoxProps } from "@chakra-ui/react";
import { APP_VERSION } from "@/shared/appVersion";

/** The running web build stamp (`vX.Y` / commit sha in prod) as a muted inline
 *  label, right-aligned on the account menu's sign-out row. Its own clicks are
 *  swallowed so tapping the version never triggers the row's sign-out action.
 *  Layout props (e.g. `ml="auto"`) are forwarded. */
export function AppVersion(props: BoxProps) {
  return (
    <Box
      as="span"
      data-cy="app-version"
      title={APP_VERSION}
      fontSize="2xs"
      fontWeight="normal"
      color="text.muted"
      whiteSpace="nowrap"
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {APP_VERSION}
    </Box>
  );
}
