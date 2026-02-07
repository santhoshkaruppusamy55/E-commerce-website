require("dotenv").config();
const { Worker } = require("bullmq");
const transporter = require("../config/mail.config");
const config = require("../config/queue.config");
const renderTemplate = require("../utils/renderEmailTemplate");
if (!process.env.REDIS_HOST) {
  console.error("FATAL: REDIS_HOST environment variable is not set!");
  process.exit(1);
}
console.log("Worker using Redis host:", process.env.REDIS_HOST);

// Only run the worker in non-test environments
if (process.env.NODE_ENV !== "test") {
  console.log("Email worker is ALIVE and waiting for jobs...");

  new Worker(
    "email-queue",
    async (job) => {
      try {
        console.log("Processing email job:", {
          jobId: job.id,
          type: job.data.type,
          to: job.data.to,
          payload: job.data.payload
        });

        const { type, to, payload } = job.data;

        let subject;
        let html;

        switch (type) {
          case "welcome":
            subject = "Welcome to our platform";
            html = await renderTemplate("welcome", payload);
            break;

          case "reset-password":
            subject = "Reset your password";
            html = await renderTemplate("resetPassword", payload);
            break;

          case "order-confirmation":
            subject = "Order confirmation";
            html = await renderTemplate("orderConfirmation", payload);
            break;

          default:
            throw new Error(`Unknown email type: ${type}`);
        }

        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to,
          subject,
          html
        });

        console.log(`Email sent successfully to ${to} | Type: ${type}`);
      } catch (err) {
        console.error("Email job failed:", {
          jobId: job.id,
          type: job.data?.type,
          to: job.data?.to,
          error: err.message,
          stack: err.stack
        });
        throw err; // Let BullMQ handle retry / failed state
      }
    },
    {
      connection: config.connection,
      // Recommended worker options
      concurrency: 5,                     // process up to 5 jobs at once
      limiter: { max: 10, duration: 1000 } // rate limit to avoid SES throttling
    }
  );

  console.log("Email worker started and listening for jobs");
}