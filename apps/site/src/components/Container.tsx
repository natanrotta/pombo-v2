import { Box, type BoxProps } from "@chakra-ui/react";

export const SiteContainer = ({ children, ...rest }: BoxProps) => (
  <Box mx="auto" w="100%" maxW={{ base: "100%", md: "1180px" }} px={{ base: 5, md: 8 }} {...rest}>
    {children}
  </Box>
);
