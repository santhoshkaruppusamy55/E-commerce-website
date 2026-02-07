require("dotenv").config();

const nodemailer = require("nodemailer");
const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");

const sesClient = new SESv2Client({
  region: process.env.AWS_SES_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SES_SECRET_KEY,
  },
});

const transporter = nodemailer.createTransport({
  SES: {
    sesClient,
    SendEmailCommand,
  },
});

module.exports = transporter;


