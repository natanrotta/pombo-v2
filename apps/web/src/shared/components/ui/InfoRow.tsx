import { memo } from "react";
import { Stack, Text } from "@chakra-ui/react";

interface InfoRowProps {
  label: string;
  value: string;
}

/** A labelled read-only value: a muted label above a primary value. */
export const InfoRow = memo(function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack spacing={0.5}>
      <Text fontSize="xs" color="text.secondary">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="600" color="text.primary">
        {value}
      </Text>
    </Stack>
  );
});
