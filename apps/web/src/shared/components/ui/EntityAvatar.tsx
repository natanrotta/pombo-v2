import { memo } from "react";
import { Avatar } from "@chakra-ui/react";
import { getInitials } from "@/shared/utils/string";

type AvatarSize = "sm" | "md" | "lg";

interface EntityAvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  gradient?: string;
}

export const EntityAvatar = memo(function EntityAvatar({
  name,
  src,
  size = "sm",
  gradient = "linear(135deg, brand.400, brand.600)",
}: EntityAvatarProps) {
  const fontSizeMap: Record<AvatarSize, string> = {
    sm: "xs",
    md: "sm",
    lg: "lg",
  };

  return (
    <Avatar
      size={size}
      src={src ?? undefined}
      name={getInitials(name)}
      bgGradient={src ? undefined : gradient}
      color="text.onBrand"
      fontWeight="700"
      fontSize={fontSizeMap[size]}
    />
  );
});
