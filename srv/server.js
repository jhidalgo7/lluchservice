
"use strict";

const cds = require("@sap/cds");
const express = require("express");
const { entityHandlers, entityHandlersPos } = require('./utils/entities'); // Nota: entityHandlersPos no se usa aquí
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const sleep = require('sleep-promise');

/**
 * Hook de bootstrap de CAP para inicializar middlewares y rutas personalizadas.
 * - Activa el proxy OData V2.
 * - Habilita parsing de JSON en requests.
 * - Expone endpoints REST para acciones de caso (prehook y event-action).
 */
cds.on("bootstrap", (app) => {
  // Middleware para exponer el adaptador OData V2
  app.use(proxy());

  // Middleware para parsear cuerpos JSON
  app.use(express.json());

  /**
   * POST /caseAction
   * ---------------------------------------------------------
   * End-point pensado para acciones de **prehook** (cds.evento = false).
   * Flujo:
   *  1) Lee { entity, currentImage, beforeImage } del body.
   *  2) Selecciona el handler correspondiente a la entidad.
   *  3) Ejecuta el handler con currentImage y beforeImage.
   *  4) Devuelve el currentImage (el patrón actual de la app).
   *
   * Respuestas:
   *  - 200: { data: currentImage }
   *  - 400: entidad no soportada o body inválido
   *  - 500: error interno al ejecutar la acción
   */
  app.post("/caseAction", async (req, res) => {
    try {
      // Marcamos contexto como prehook
      cds.evento = false;

      // Validación básica del body para mejorar robustez
      const { entity, currentImage, beforeImage } = req.body || {};
      if (!entity || typeof currentImage !== "object") {
        return res.status(400).send({ error: "Body inválido: se requiere 'entity' y 'currentImage'." });
      }

      console.log("Req Body caseAction:", JSON.stringify(req.body));

      // Selección dinámica de handler por entidad
      const handler = entityHandlers[entity];
      if (!handler) {
        return res.status(400).send({ error: `Entidad no soportada: ${entity}` });
      }

      // Ejecutamos el handler y registramos respuesta de modificación
      const responseModify = await handler(currentImage, beforeImage);
      console.warn("Return caseAction", JSON.stringify(responseModify));

      // Patrón actual: devolver el currentImage; si necesitas devolver cambios aplicados, usa responseModify
      res.send({ data: currentImage });

    } catch (error) {
      console.error("Error al ejecutar caseAction:", error);
      return res.status(500).send({ error: error.message || "Error interno" });
    }
  });

  /**
   * POST /CaseEventAction
   * ---------------------------------------------------------
   * End-point para manejar **eventos de flujo** (autoflows/hooks) en modo **evento** (cds.evento = true).
   * Flujo:
   *  1) Lee { type, data } del body; de data extrae currentImage y beforeImage.
   *  2) Selecciona el handler por 'type' (normalmente la entidad del evento).
   *  3) Ejecuta el handler.
   *  4) Devuelve el currentImage.
   *
   * Respuestas:
   *  - 200: { data: currentImage }
   *  - 400: tipo no soportado o body inválido
   *  - 500: error interno al ejecutar la acción
   */
  app.post("/CaseEventAction", async (req, res) => {
    try {
      // Marcamos contexto como evento (permite a la lógica decidir si hace PATCH, etc.)
      cds.evento = true;

      // Validación básica del body
      const { type, data } = req.body || {};
      if (!type || !data || typeof data.currentImage !== "object") {
        return res.status(400).send({ error: "Body inválido: se requiere 'type' y 'data.currentImage'." });
      }

      const { currentImage, beforeImage } = data;
      console.log("Req Body flujo:", JSON.stringify(req.body));

      // Selección dinámica de handler por tipo
      const handler = entityHandlers[type];
      if (!handler) {
        return res.status(400).send({ error: `Entidad no soportada: ${type}` });
      }

      // Ejecutamos el handler
      const responseModify = await handler(currentImage, beforeImage);
      console.warn("Return modificado CaseEventAction", JSON.stringify(responseModify));

      // Patrón actual: devolver el currentImage
      res.send({ data: currentImage });

    } catch (error) {
      console.error("Error al ejecutar CaseEventAction:", error);
      return res.status(500).send({ error: error.message || "Error interno" });
    }
  });
});

module.exports = cds.server;
