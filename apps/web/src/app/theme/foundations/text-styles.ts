export const textStyles = {
  display: {
    fontFamily: "heading",
    fontWeight: "800",
    fontSize: { base: "2xl", md: "3xl" },
    lineHeight: "1.2",
    // JetBrains Mono runs wide at heavy weights — pull tracking in a touch
    // more than the previous sans display so large headings stay compact.
    letterSpacing: "-0.03em",
  },
  pageTitle: {
    fontFamily: "heading",
    fontWeight: "700",
    fontSize: { base: "lg", md: "xl" },
    lineHeight: "1.25",
    letterSpacing: "tight",
  },
  sectionTitle: {
    fontFamily: "heading",
    fontWeight: "700",
    fontSize: "md",
    lineHeight: "1.3",
  },
  eyebrow: {
    fontFamily: "heading",
    fontWeight: "700",
    fontSize: "xs",
    lineHeight: "1.2",
    letterSpacing: "wider",
    textTransform: "uppercase",
  },
  body: {
    fontFamily: "body",
    fontWeight: "400",
    fontSize: "sm",
    lineHeight: "1.6",
  },
  bodyStrong: {
    fontFamily: "body",
    fontWeight: "600",
    fontSize: "sm",
    lineHeight: "1.5",
  },
  caption: {
    fontFamily: "body",
    fontWeight: "500",
    fontSize: "xs",
    lineHeight: "1.4",
  },
  mono: {
    fontFamily: "mono",
    fontWeight: "500",
    fontSize: "xs",
    lineHeight: "1.4",
  },
};
