import { Box, Flex, Text, type FlexProps } from "@chakra-ui/react";

type Props = FlexProps & { showWordmark?: boolean; size?: "sm" | "md" | "lg" };

const SIZES = {
  sm: { box: 7, font: "md", radius: "md" },
  md: { box: 9, font: "lg", radius: "lg" },
  lg: { box: 10, font: "xl", radius: "lg" },
} as const;

// Neutral placeholder logo: a simple gradient geometric icon + "Boilerplate"
// wordmark. Swap this for your own brand mark. No external image dependency.
export const BrandMark = ({ showWordmark = true, size = "md", ...rest }: Props) => {
  const s = SIZES[size];
  return (
    <Flex align="center" gap={2.5} {...rest}>
      <Flex
        w={s.box}
        h={s.box}
        flexShrink={0}
        borderRadius={s.radius}
        align="center"
        justify="center"
        bgGradient="linear(135deg, brand.500, accent.500)"
        boxShadow="0 8px 18px -8px rgba(47, 128, 237, 0.5)"
        aria-hidden
      >
        <Box w="45%" h="45%" borderRadius="sm" bg="whiteAlpha.900" />
      </Flex>
      {showWordmark && (
        <Text fontWeight="800" fontSize={s.font} letterSpacing="tighter" color="text.primary">
          Boilerplate
        </Text>
      )}
    </Flex>
  );
};
