import { ReactNode } from "react";
import { Box, Stack } from "@chakra-ui/react";

const Section = ({ children }: { children: ReactNode }) => (
  <Stack as="section" spacing={3}>
    {children}
  </Stack>
);

// Placeholder legal content for the boilerplate. Replace every section with your
// own terms of use — reviewed by a qualified lawyer — before publishing.

export const termsContentPt: ReactNode = (
  <>
    <Section>
      <Box as="p">
        Este é um modelo de exemplo. Substitua todo o conteúdo abaixo pelos seus próprios Termos de
        Uso antes de publicar.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Aceitação dos termos</Box>
      <Box as="p">
        Descreva as condições sob as quais os usuários podem acessar e usar o seu produto.
      </Box>
    </Section>

    <Section>
      <Box as="h2">2. Uso do serviço</Box>
      <Box as="p">Defina o uso aceitável, as responsabilidades do usuário e as restrições.</Box>
    </Section>

    <Section>
      <Box as="h2">3. Limitação de responsabilidade</Box>
      <Box as="p">
        Explique os limites da sua responsabilidade e as isenções de garantia aplicáveis.
      </Box>
    </Section>

    <Section>
      <Box as="h2">4. Contato</Box>
      <Box as="p">
        Dúvidas sobre estes termos? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);

export const termsContentEn: ReactNode = (
  <>
    <Section>
      <Box as="p">
        This is a sample template. Replace all of the content below with your own Terms of Use before
        publishing.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Acceptance of terms</Box>
      <Box as="p">Describe the conditions under which users may access and use your product.</Box>
    </Section>

    <Section>
      <Box as="h2">2. Use of the service</Box>
      <Box as="p">Define acceptable use, user responsibilities and restrictions.</Box>
    </Section>

    <Section>
      <Box as="h2">3. Limitation of liability</Box>
      <Box as="p">Explain the limits of your liability and any applicable warranty disclaimers.</Box>
    </Section>

    <Section>
      <Box as="h2">4. Contact</Box>
      <Box as="p">
        Questions about these terms? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);

export const termsContentEs: ReactNode = (
  <>
    <Section>
      <Box as="p">
        Esta es una plantilla de ejemplo. Reemplaza todo el contenido a continuación con tus propios
        Términos de Uso antes de publicar.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Aceptación de los términos</Box>
      <Box as="p">
        Describe las condiciones bajo las cuales los usuarios pueden acceder y usar tu producto.
      </Box>
    </Section>

    <Section>
      <Box as="h2">2. Uso del servicio</Box>
      <Box as="p">Define el uso aceptable, las responsabilidades del usuario y las restricciones.</Box>
    </Section>

    <Section>
      <Box as="h2">3. Limitación de responsabilidad</Box>
      <Box as="p">
        Explica los límites de tu responsabilidad y las exenciones de garantía aplicables.
      </Box>
    </Section>

    <Section>
      <Box as="h2">4. Contacto</Box>
      <Box as="p">
        ¿Dudas sobre estos términos? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);
