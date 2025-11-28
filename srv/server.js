"use strict";

const cds = require("@sap/cds");
const express = require("express");
const { entityHandlers, entityHandlersPos } = require('./utils/entities');
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const sleep = require('sleep-promise');

cds.on("bootstrap", (app) => {
  app.use(proxy());
  app.use(express.json());

  app.post("/caseAction", async (req, res) => {
    try {
      cds.evento = false;
      const { entity, currentImage, beforeImage } = req.body
      console.log("Req Body caseAction: " + JSON.stringify(req.body));
      const handler = entityHandlers[entity];
      if (!handler) {
        return res.status(400).send({ error: `Entidad no soportada: ${entity}` });
      }
      let responseModify = await handler(currentImage, beforeImage);
      console.warn(`Return caseAction ${JSON.stringify(responseModify)}`)
 
      res.send({ data: currentImage });

    } catch (error) {
      console.error("Error al ejecutar caseAction:", error);
      return res.status(500).send({ error: error.message });
    }
  });

  app.post("/CaseEventAction", async (req, res) => {
    try {
      cds.evento = true;
      const { type, data } = req.body;
      const { currentImage, beforeImage } = data;
      console.log("Req Body flujo: " + JSON.stringify(req.body));
      const handler = entityHandlers[type];
      if (!handler) {
        return res.status(400).send({ error: `Entidad no soportada: ${type}` });
      }
      let responseModify = await handler(currentImage, beforeImage);
      console.warn(`Return modificado CaseEventAction ${JSON.stringify(responseModify)}`)
      res.send({ data: currentImage });

    } catch (error) {
      console.error("Error al ejecutar CaseEventAction:", error);
      return res.status(500).send({ error: error.message });
    }
  });
});

module.exports = cds.server;