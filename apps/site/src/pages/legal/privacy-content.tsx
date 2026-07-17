import { ReactNode } from "react";
import { Box, Stack } from "@chakra-ui/react";

const Section = ({ children }: { children: ReactNode }) => (
  <Stack as="section" spacing={3}>
    {children}
  </Stack>
);

// Placeholder legal content for the boilerplate. Replace every section with your
// own privacy policy — reviewed by a qualified lawyer — before publishing.

export const privacyContentPt: ReactNode = (
  <>
    <Section>
      <Box as="p">
        Este é um modelo de exemplo. Substitua todo o conteúdo abaixo pela sua própria Política de
        Privacidade antes de publicar.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Quem somos</Box>
      <Box as="p">
        Descreva aqui a empresa ou pessoa responsável pelo tratamento dos dados e como entrar em
        contato.
      </Box>
    </Section>

    <Section>
      <Box as="h2">2. Dados que coletamos</Box>
      <Box as="p">
        Liste os tipos de dados que o seu produto coleta e como eles são utilizados.
      </Box>
    </Section>

    <Section>
      <Box as="h2">3. Seus direitos</Box>
      <Box as="p">
        Explique como as pessoas podem acessar, corrigir ou excluir os seus dados, e como exercer os
        demais direitos aplicáveis.
      </Box>
    </Section>

    <Section>
      <Box as="h2">4. Contato</Box>
      <Box as="p">
        Dúvidas sobre esta política? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);

export const privacyContentEn: ReactNode = (
  <>
    <Section>
      <Box as="p">
        This is a sample template. Replace all of the content below with your own Privacy Policy
        before publishing.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Who we are</Box>
      <Box as="p">
        Describe the company or person responsible for processing data and how to get in touch.
      </Box>
    </Section>

    <Section>
      <Box as="h2">2. Data we collect</Box>
      <Box as="p">List the types of data your product collects and how it is used.</Box>
    </Section>

    <Section>
      <Box as="h2">3. Your rights</Box>
      <Box as="p">
        Explain how people can access, correct or delete their data, and how to exercise any other
        applicable rights.
      </Box>
    </Section>

    <Section>
      <Box as="h2">4. Contact</Box>
      <Box as="p">
        Questions about this policy? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);

export const privacyContentEs: ReactNode = (
  <>
    <Section>
      <Box as="p">
        Esta es una plantilla de ejemplo. Reemplaza todo el contenido a continuación con tu propia
        Política de Privacidad antes de publicar.
      </Box>
    </Section>

    <Section>
      <Box as="h2">1. Quiénes somos</Box>
      <Box as="p">
        Describe la empresa o persona responsable del tratamiento de los datos y cómo contactarla.
      </Box>
    </Section>

    <Section>
      <Box as="h2">2. Datos que recopilamos</Box>
      <Box as="p">Enumera los tipos de datos que tu producto recopila y cómo se utilizan.</Box>
    </Section>

    <Section>
      <Box as="h2">3. Tus derechos</Box>
      <Box as="p">
        Explica cómo las personas pueden acceder, corregir o eliminar sus datos, y cómo ejercer los
        demás derechos aplicables.
      </Box>
    </Section>

    <Section>
      <Box as="h2">4. Contacto</Box>
      <Box as="p">
        ¿Dudas sobre esta política? <a href="mailto:hello@example.com">hello@example.com</a>
      </Box>
    </Section>
  </>
);
