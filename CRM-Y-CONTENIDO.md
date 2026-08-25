# CRM privado de Impronte Vitale

El sitio utiliza un único panel propio en `/admin/`. Supabase administra la identidad y la base privada; Vercel ejecuta las funciones seguras; GitHub conserva solamente el código público.

## Acceso

- Correo permitido: `improntevitale.orx@gmail.com`
- Autenticación: correo y contraseña de Supabase Auth.
- Sesión: cookies `HttpOnly`, `Secure` y `SameSite=Strict`.
- No existe registro público desde la página.

## Módulos

- Consultas de contacto con estado y notas privadas.
- Respuestas de cuestionarios, tests y ficha técnica.
- Moderación de comentarios.
- Artículos con borrador, publicación, archivo e imagen.
- Editor visual de recursos por etapas y preguntas.
- Contenido editable de la portada y enlace global de agenda.

## Datos privados

Las llaves se configuran exclusivamente en Vercel mediante `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY` y `ADMIN_EMAIL`. El código también acepta las llaves antiguas `service_role/anon` para proyectos que todavía las utilicen. El archivo `.env.example` solo muestra los nombres y nunca debe contener valores reales.

## Activación

Seguí `ACTIVAR-CRM-PASO-A-PASO.txt`. El esquema completo está en `crm/supabase.sql` y se puede ejecutar de nuevo cuando el proyecto necesite actualizarse.

## Privacidad

La ficha técnica puede contener información sensible y datos de personas menores. Antes de usarla como expediente definitivo deben definirse plazos de conservación, respaldo, control de accesos y la revisión profesional/legal correspondiente.
