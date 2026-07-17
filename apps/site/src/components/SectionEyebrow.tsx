import { HStack, Box, Text, type StackProps } from "@chakra-ui/react";

type Props = StackProps & { label: string };

export const SectionEyebrow = ({ label, ...rest }: Props) => (
  <HStack spacing={3} {...rest}>
    <Box w={6} h="1.5px" bgGradient="linear(to-r, brand.500, accent.500)" />
    <Text
      fontSize="xs"
      fontWeight="700"
      letterSpacing="0.18em"
      textTransform="uppercase"
      color="text.brand"
    >
      {label}
    </Text>
  </HStack>
);
