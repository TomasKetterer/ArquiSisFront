const serverless = require("serverless-http");
const express = require("express");
const AWS = require("aws-sdk");
const { PDFDocument } = require("pdf-lib");

const app = express();
const S3 = new AWS.S3();

// Middleware para manejar el cuerpo de las solicitudes en JSON
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { userData, matchData } = req.body;

    // Validar los datos recibidos
    if (!userData || !matchData) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    // Crear el PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    page.drawText(`Nombre del grupo: ${userData.groupName}`, { x: 50, y: 350 });
    page.drawText(`Usuario: ${userData.name}`, { x: 50, y: 330 });
    page.drawText(`Partido: ${matchData.teams}`, { x: 50, y: 310 });

    const pdfBytes = await pdfDoc.save();

    // Parámetros para subir el PDF a S3
    const params = {
      Bucket: 'node-craft',  // Cambia esto por el nombre correcto de tu bucket S3
      Key: `boletas/${userData.name}.pdf`,  // Nombre del archivo PDF en S3
      Body: Buffer.from(pdfBytes),
      ContentType: 'application/pdf',
      ACL: 'public-read'  // Permitir acceso público
    };

    // Subir el archivo PDF a S3
    const data = await S3.upload(params).promise();

    // Devolver la URL pública del archivo PDF
    res.status(200).json({
      message: "Boleta generada con éxito",
      pdfUrl: data.Location
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Error generando la boleta", error });
  }
});

// Exportar el handler para AWS Lambda
module.exports.handler = serverless(app);
