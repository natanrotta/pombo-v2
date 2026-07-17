import { Flex, Icon, Text } from "@chakra-ui/react";
import { FiAlertTriangle, FiCheck, FiInfo, FiXCircle } from "@/shared/components/icons";

const STATUS_CONFIG = {
  success: { icon: FiCheck, bg: "#ecfdf5", border: "#a7f3d0", iconBg: "#10b981", text: "#065f46" },
  info: { icon: FiInfo, bg: "#eff6ff", border: "#bfdbfe", iconBg: "#3b82f6", text: "#1e40af" },
  warning: {
    icon: FiAlertTriangle,
    bg: "#faf5ff",
    border: "#e9d8fd",
    iconBg: "#805ad5",
    text: "#553c9a",
  },
  error: { icon: FiXCircle, bg: "#fef2f2", border: "#fecaca", iconBg: "#ef4444", text: "#991b1b" },
} as const;

export type ToastStatus = keyof typeof STATUS_CONFIG;

export function ToastContent({
  title,
  description,
  status,
}: {
  title: string;
  description?: string;
  status: ToastStatus;
}) {
  const config = STATUS_CONFIG[status];
  return (
    <Flex
      align="center"
      gap={3}
      px={4}
      py={3}
      bg={config.bg}
      borderRadius="xl"
      shadow="0 4px 20px rgba(0,0,0,0.08)"
      border="1px solid"
      borderColor={config.border}
      mx="auto"
      w="fit-content"
      maxW="420px"
    >
      <Flex
        align="center"
        justify="center"
        w={7}
        h={7}
        borderRadius="full"
        bg={config.iconBg}
        flexShrink={0}
      >
        <Icon as={config.icon} boxSize={4} color="white" />
      </Flex>
      <Flex direction="column" gap={0.5}>
        <Text fontSize="sm" fontWeight="600" color={config.text} lineHeight="short">
          {title}
        </Text>
        {description && (
          <Text fontSize="xs" color={config.text} opacity={0.75} lineHeight="short">
            {description}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
