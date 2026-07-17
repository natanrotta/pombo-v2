import { Heading, type HeadingProps } from "@chakra-ui/react";

type Props = HeadingProps & { highlight?: string };

export const GradientHeading = ({ children, highlight, ...rest }: Props) => {
  if (!highlight) {
    return <Heading {...rest}>{children}</Heading>;
  }
  const text = String(children ?? "");
  const idx = text.indexOf(highlight);
  if (idx === -1) {
    return <Heading {...rest}>{children}</Heading>;
  }
  return (
    <Heading {...rest}>
      {text.slice(0, idx)}
      <Heading
        as="span"
        display="inline"
        fontSize="inherit"
        fontWeight="inherit"
        bgGradient="linear(135deg, brand.500, accent.500)"
        bgClip="text"
        sx={{ WebkitTextFillColor: "transparent" }}
      >
        {highlight}
      </Heading>
      {text.slice(idx + highlight.length)}
    </Heading>
  );
};
