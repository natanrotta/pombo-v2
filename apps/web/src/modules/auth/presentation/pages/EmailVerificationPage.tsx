import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Heading,
  Link,
  PinInput,
  PinInputField,
  Stack,
  Text,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/app/router/RoutePaths";
import { useAuth } from "@/modules/auth/presentation/hooks/useAuth";
import { getPostAuthDestination } from "@/modules/auth/presentation/utils/postAuthDestination";
import { useNotify } from "@/shared/hooks/useNotify";
import { LanguageSelector } from "@/shared/components/ui/LanguageSelector";

const MotionBox = motion(Box);

const PIN_LENGTH = 6;
/** Mirrors the backend resend cooldown (EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS). */
const RESEND_COOLDOWN_SECONDS = 60;

export function EmailVerificationPage() {
  const { t } = useTranslation("auth");
  const { t: tc } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const { sendVerificationPin, verifyEmailPin, discardEmailVerification, isSubmitting } = useAuth();
  const { showError, showSuccess } = useNotify();

  const email = (location.state as { email?: string } | null)?.email ?? "";

  const [pin, setPin] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);
  // StrictMode runs effects twice in dev — guard the initial auto-send so we
  // don't trip the server-side cooldown on first paint.
  const hasSentRef = useRef(false);
  // PinInput's onComplete and the submit button can both fire handleVerify;
  // guard against a double submit while a verify is in flight.
  const isVerifyingRef = useRef(false);

  // Dispatch the first PIN once on mount.
  useEffect(() => {
    if (hasSentRef.current) return;
    hasSentRef.current = true;
    void sendVerificationPin().catch((error: unknown) => {
      // On a page refresh the auto-send may hit the server-side cooldown — a
      // code is already in the inbox, so swallow that specific error instead
      // of showing a misleading "couldn't send" toast.
      const code = (error as { code?: string } | null)?.code;
      if (code === "AUTH_EMAIL_VERIFICATION_RATE_LIMITED") return;
      showError(error, t("verifyEmail.sendError"));
    });
  }, [sendVerificationPin, showError, t]);

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (isVerifyingRef.current) return;
      isVerifyingRef.current = true;
      try {
        const session = await verifyEmailPin(code);
        navigate(getPostAuthDestination(session.user), { replace: true });
      } catch (error) {
        setPin("");
        showError(error, t("verifyEmail.verifyError"));
      } finally {
        isVerifyingRef.current = false;
      }
    },
    [verifyEmailPin, navigate, showError, t]
  );

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      await sendVerificationPin();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      showSuccess(t("verifyEmail.resendSuccess"));
    } catch (error) {
      showError(error, t("verifyEmail.sendError"));
    } finally {
      setIsResending(false);
    }
  }, [cooldown, isResending, sendVerificationPin, showSuccess, showError, t]);

  const card = (
    <MotionBox
      bg="bg.surface"
      borderWidth="1px"
      borderColor="border.subtle"
      boxShadow="shadow.panel"
      borderRadius="3xl"
      p={{ base: 6, md: 8 }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      w="full"
    >
      <Stack spacing={2} mb={6}>
        <Text fontWeight="700" color="text.brand" letterSpacing="wide" fontSize="sm">
          {tc("platform.name")}
        </Text>
        <Heading size="lg">{t("verifyEmail.title")}</Heading>
        <Text color="text.secondary">
          {email ? t("verifyEmail.subtitleWithEmail", { email }) : t("verifyEmail.subtitle")}
        </Text>
      </Stack>

      <Stack spacing={6}>
        <HStack justify="center" spacing={{ base: 2, md: 3 }}>
          <PinInput
            otp
            type="number"
            value={pin}
            onChange={setPin}
            onComplete={handleVerify}
            isDisabled={isSubmitting}
            size="lg"
            autoFocus
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <PinInputField key={i} />
            ))}
          </PinInput>
        </HStack>

        <Button
          size="lg"
          onClick={() => handleVerify(pin)}
          isLoading={isSubmitting}
          loadingText={t("verifyEmail.verifying")}
          isDisabled={pin.length !== PIN_LENGTH}
        >
          {t("verifyEmail.submit")}
        </Button>

        <Flex justify="center" align="center" gap={1.5}>
          <Text fontSize="sm" color="text.secondary">
            {t("verifyEmail.noCode")}
          </Text>
          <Button
            variant="link"
            size="sm"
            onClick={handleResend}
            isDisabled={cooldown > 0 || isResending}
            isLoading={isResending}
            color="text.brand"
            fontWeight="600"
          >
            {cooldown > 0
              ? t("verifyEmail.resendIn", { seconds: cooldown })
              : t("verifyEmail.resend")}
          </Button>
        </Flex>

        <Text color="text.secondary" fontSize="sm" textAlign="center">
          <Link
            as={RouterLink}
            to={ROUTE_PATHS.register}
            onClick={discardEmailVerification}
            color="text.brand"
            fontWeight="600"
          >
            {t("verifyEmail.backToRegister")}
          </Link>
        </Text>
      </Stack>
    </MotionBox>
  );

  return (
    <Flex minH="100vh" align="center" justify="center" px={4} py={8}>
      <Container maxW="md" px={0}>
        <Flex justify="flex-end" mb={4}>
          <LanguageSelector />
        </Flex>
        {card}
      </Container>
    </Flex>
  );
}
