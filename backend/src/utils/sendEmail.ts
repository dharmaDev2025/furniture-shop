import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachment?: Buffer,
  filename?: string
): Promise<void> => {

  await transporter.sendMail({
    from: `"Nilamadhamb Furniture" <${process.env.EMAIL_USER}>`,

    to: to,

    subject: subject,

    html: html,

    attachments:
      attachment && filename
        ? [
            {
              filename: filename,
              content: attachment,
              contentType: "application/pdf",
            },
          ]
        : [],
  });
};