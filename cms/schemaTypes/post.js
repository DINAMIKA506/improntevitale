import { defineArrayMember, defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Artículos",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "Dirección del artículo", type: "slug", options: { source: "title", maxLength: 96 }, validation: (rule) => rule.required() }),
    defineField({ name: "excerpt", title: "Resumen", type: "text", rows: 3, validation: (rule) => rule.required().max(240) }),
    defineField({ name: "category", title: "Tema", type: "string", options: { list: ["Psicopedagogía", "Inclusión", "Aprendizaje", "Orientación", "Proyecto de vida"] }, validation: (rule) => rule.required() }),
    defineField({ name: "publishedAt", title: "Fecha de publicación", type: "datetime", initialValue: () => new Date().toISOString(), validation: (rule) => rule.required() }),
    defineField({ name: "readTime", title: "Tiempo de lectura", type: "string", placeholder: "4 min de lectura" }),
    defineField({ name: "mainImage", title: "Imagen de portada", type: "image", options: { hotspot: true }, fields: [{ name: "alt", title: "Descripción de la imagen", type: "string" }], validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Contenido", type: "array", of: [defineArrayMember({ type: "block" }), defineArrayMember({ type: "image", options: { hotspot: true }, fields: [{ name: "alt", title: "Descripción de la imagen", type: "string" }] })], validation: (rule) => rule.required() })
  ],
  preview: { select: { title: "title", subtitle: "category", media: "mainImage" } }
});
