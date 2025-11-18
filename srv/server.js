"use strict";

const cds = require("@sap/cds");
const express = require("express");
const proxy = require("@sap/cds-odata-v2-adapter-proxy");
const sleep = require('sleep-promise');

cds.on("bootstrap", (app) => {
  app.use(proxy());
  app.use(express.json());
  app.post("/SalesAreaDeterAction", async (req, res) => {
    try {
      const id = req.body?.data?.currentImage?.id;
      console.log("Req Body SalesAreaDeterAction: " + JSON.stringify(req.body));
      await sleep(1000);
      if (!id) return res.status(400).send({ error: "No se ha proporcionado un ID válido" });
      try {
        console.log("headers recibidos:" + JSON.stringify(req.headers));
      } catch (oError) {
        
      }
      const srv = cds.services.LluchService;
      if (!srv) throw new Error("Servicio LluchService no encontrado en cds.services");

      const result = await srv.send({
        event: "SalesAreaDeterAction",
        data: { id },
        headers: req.headers

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
      console.log("Req Body PartiesRedetAction: " + JSON.stringify(req.body));
      await sleep(1000);
      if (!id) return res.status(400).send({ error: "No se ha proporcionado un ID válido" });

      const srv = cds.services.LluchService;
      if (!srv) throw new Error("Servicio LluchService no encontrado en cds.services");

      const result = await srv.send({
        event: "PartiesRedetAction",
        data: { id },
        headers: req.headers

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