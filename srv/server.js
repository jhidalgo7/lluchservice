"use strict";

const cds = require("@sap/cds");
const express = require("express");
const { entityHandlers } = require('./utils/entities');
const proxy = require("@sap/cds-odata-v2-adapter-proxy");

cds.on("bootstrap", (app) => {
  app.use(proxy());
  app.use(express.json());

  app.post("/caseAction", async (req, res) => {
    try {
      const { entity, currentImage, beforeImage } = req.body
      console.log("Req Body SalesArea_PartiesDeterAction: " + JSON.stringify(req.body));
      const handler = entityHandlers[entity];
      if (!handler) {
        return res.status(400).send({ error: `Entidad no soportada: ${entity}` });
      }
      await handler(currentImage, beforeImage);


      res.send({ data: currentImage });

    } catch (error) {
      console.error("Error al ejecutar PartiesRedetAction:", error);
      return res.status(500).send({ error: error.message });
    }
  });
});

module.exports = cds.server;