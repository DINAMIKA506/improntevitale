# CRM y gestión de contenido de Impronte Vitale

## Decisión recomendada

La solución queda dividida en dos herramientas gratuitas porque cumplen funciones distintas:

1. **Sanity** para crear y editar artículos. Es un gestor de contenido agradable y evita tocar archivos HTML cada vez que se publica.
2. **Supabase** para comentarios y respuestas de formularios. Es una base de datos privada con reglas de acceso; aquí se guarda la información que no debe quedar expuesta.
3. **Vercel** mantiene las llaves secretas y recibe los envíos mediante funciones del servidor. Ninguna llave privada aparece en el navegador ni en GitHub.

No se deben guardar cédulas, datos de menores o fichas técnicas dentro del conjunto público gratuito de Sanity.

Las dos herramientas ofrecen un nivel gratuito adecuado para preparar y probar este flujo. Sin embargo, el plan gratuito de Supabase puede pausarse por inactividad y no incluye copias de seguridad automáticas. Antes de tratar las fichas como expediente definitivo conviene definir un respaldo y revisar si el nivel contratado cumple las obligaciones profesionales y legales aplicables.

## Activar comentarios y formularios

1. Crear un proyecto gratuito en Supabase.
2. Abrir **SQL Editor**, pegar el contenido de `crm/supabase.sql` y ejecutarlo.
3. En **Project settings → API**, copiar `Project URL` y crear/copiar una **Secret key**.
4. En Vercel → proyecto → **Settings → Environment Variables**, crear:
   - `SUPABASE_URL`
   - `SUPABASE_SECRET_KEY`
5. Volver a desplegar el proyecto.
6. Para aprobar comentarios: en Supabase → Table Editor → `blog_comments`, cambiar `status` de `pending` a `approved`.
7. Para revisar cuestionarios: abrir `resource_submissions` y actualizar `status` a `reviewing`, `completed` o `archived`.

## Activar el gestor del blog

1. Crear un proyecto gratuito en Sanity con el conjunto `production`.
2. En la carpeta `cms`, copiar `.env.example` como `.env` y completar el ID del proyecto.
3. Instalar dependencias y abrir el estudio de contenido.
4. En Vercel crear:
   - `SANITY_PROJECT_ID`
   - `SANITY_DATASET` con valor `production`
5. Volver a desplegar. Los artículos nuevos aparecerán en el blog y abrirán en `/blog/articulo/?slug=...`.

## Antes de recibir fichas reales

- Publicar una política de privacidad con finalidades, plazo de conservación, persona responsable y medio para solicitar eliminación o corrección.
- Definir quién tendrá acceso al proyecto de Supabase y activar doble factor en las cuentas administradoras.
- No compartir capturas ni exportaciones que contengan cédulas o información de personas menores.
- Revisar y eliminar datos que ya no sean necesarios.
- La ficha está marcada `noindex` para que Google no la presente como página pública de búsqueda.

## Flujo final

`Persona visitante → formulario/comentario → función privada de Vercel → Supabase`

`Valerie → Sanity Studio → publicar artículo → blog de Impronte Vitale`
