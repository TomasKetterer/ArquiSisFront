const serverless = require("serverless-http");
const express = require("express");
const AWS = require("aws-sdk");
const { PDFDocument } = require("pdf-lib");

const app = express();
const S3 = new AWS.S3();

app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { userData, matchData } = req.body;

    if (!userData || !matchData) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const { home, away } = matchData.teams;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);

    page.drawText(`Usuario: ${userData.name}`, { x: 50, y: 330 });
    page.drawText(`Correo: ${userData.email}`, { x: 50, y: 310 });
    page.drawText(`Partido:`, { x: 50, y: 290 });
    page.drawText(`Equipo Local: ${home.name}`, { x: 50, y: 270 });
    page.drawText(`Equipo Visitante: ${away.name}`, { x: 50, y: 250 });
    page.drawText(`Fecha del Partido: ${matchData.date}`, { x: 50, y: 230 });
    page.drawText(`Monto de la compra: ${matchData.amount}`, { x: 50, y: 210 });

    const pdfBytes = await pdfDoc.save();

    const params = {
      Bucket: 'node-craft',
      Key: `boletas/${userData.name}_${Date.now()}.pdf`,
      Body: Buffer.from(pdfBytes),
      ContentType: 'application/pdf',
    };

    const data = await S3.upload(params).promise();

    res.status(200).json({
      message: "Boleta generada con éxito",
      pdfUrl: data.Location
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error generando la boleta", error });
  }
});

module.exports.handler = serverless(app);
