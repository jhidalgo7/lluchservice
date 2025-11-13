"use strict";

const cds = require("@sap/cds");
const express = require("express");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");

cds.on("bootstrap", (app) => {
  app.use(proxy());
  app.use(express.json());
  app.post("/SalesAreaDeterAction", async (req, res) => {
    try {
      const id = req.body?.data?.currentImage?.id;
      console.log("Req Body: " + JSON.stringify(req.body));
      if (!id) return res.status(400).send({ error: "No se ha proporcionado un ID válido" });

      const srv = cds.services.LluchService;
      if (!srv) throw new Error("Servicio LluchService no encontrado en cds.services");

      const result = await srv.send({
        event: "SalesAreaDeterAction",
        data: { id }
      });

      return res.status(200).send({
        message: "Acción ejecutada correctamente",
        result,
      });
    } catch (error) {
      console.error("Error al ejecutar SalesAreaDeterAction:", error);
      return res.status(500).send({ error: error.message });
    }
  });

  app.post("/PartiesRedetAction", async (req, res) => {
    try {
      const id = req.body?.data?.currentImage?.id;
      if (!id) return res.status(400).send({ error: "No se ha proporcionado un ID válido" });

      const srv = cds.services.LluchService;
      if (!srv) throw new Error("Servicio LluchService no encontrado en cds.services");

      const result = await srv.send({
        event: "PartiesRedetAction",
        data: { id }
      });

      return res.status(200).send({
        message: "Acción ejecutada correctamente",
        result,
      });
    } catch (error) {
      console.error("Error al ejecutar PartiesRedetAction:", error);
      return res.status(500).send({ error: error.message });
    }
  });
});

module.exports = cds.server;