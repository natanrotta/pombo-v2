import { Box, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { FiCircle } from "@/shared/components/icons";
import type { IconType } from "@/shared/components/icons";
import type { ReactNode } from "react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: ReactNode;
  time: string;
  date?: string;
  icon?: IconType;
  iconBg?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  metadata?: { label: string; value: string }[];
}

interface AppTimelineProps {
  items: TimelineItem[];
}

export function AppTimeline({ items }: AppTimelineProps) {
  return (
    <Stack spacing={0}>
      {items.map((item, index) => (
        <Flex
          key={item.id}
          data-cy="timeline-item"
          gap={4}
          align="flex-start"
          py={4}
          px={3}
          borderRadius="lg"
          transition="all 0.18s ease"
          cursor={item.onClick ? "pointer" : undefined}
          onClick={item.onClick}
          _hover={item.onClick ? { bg: "bg.brand.subtle", borderColor: "border.brand" } : undefined}
        >
          <Flex direction="column" align="center" pt={0.5}>
            <Flex
              align="center"
              justify="center"
              w={8}
              h={8}
              borderRadius="full"
              bg={item.iconBg ?? "bg.brand.subtle"}
              color={item.iconBg ? "text.onBrand" : "text.brand"}
              flexShrink={0}
            >
              <Icon as={item.icon ?? FiCircle} boxSize={4} />
            </Flex>
            {index < items.length - 1 && (
              <Box
                w="2px"
                flex={1}
                minH="24px"
                bgGradient="linear(to-b, brand.200, brand.100)"
                mt={1}
                borderRadius="full"
              />
            )}
          </Flex>
          <Stack spacing={1} flex={1} pb={index < items.length - 1 ? 2 : 0}>
            <Flex align="center" gap={2} minW={0}>
              <Text fontWeight="600" fontSize="sm" noOfLines={1}>
                {item.title}
              </Text>
              {item.badge}
            </Flex>
            {item.date && (
              <Text fontSize="xs" color="brand.600" fontWeight="600">
                {item.date}
              </Text>
            )}
            {item.description && (
              <Box fontSize="sm" color="text.secondary" noOfLines={2}>
                {item.description}
              </Box>
            )}
            {item.time && (
              <Text fontSize="xs" color="text.muted">
                {item.time}
              </Text>
            )}
            {item.metadata && item.metadata.length > 0 && (
              <Flex gap={4} mt={1} flexWrap="wrap">
                {item.metadata.map((meta) => (
                  <Text key={meta.label} fontSize="xs" color="text.muted">
                    <Text as="span" fontWeight="600" color="text.secondary">
                      {meta.label}:
                    </Text>{" "}
                    {meta.value}
                  </Text>
                ))}
              </Flex>
            )}
          </Stack>
          {/* Actions sit in the row (not the title line) and self-center
              vertically, so a single-action icon (e.g. delete) lines up with
              the middle of the whole item instead of hugging the title. */}
          {item.actions && (
            <Box flexShrink={0} alignSelf="center" onClick={(e) => e.stopPropagation()}>
              {item.actions}
            </Box>
          )}
        </Flex>
      ))}
    </Stack>
  );
}
