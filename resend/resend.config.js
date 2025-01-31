import { Resend } from 'resend'

import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (msg) => {
  try {
    const { data, error } = await resend.emails.send(msg);
    if (error) {
      console.error("Error al enviar el correo", error);
      throw new Error(`Error al enviar correo: ${error}`);
    }
    console.log("Correo enviado exitosamente", data);
  } catch (error) {
    console.error("Error al enviar el correo", error);
    throw new Error(`Error al enviar correo: ${error}`);
  }
};

export const sender = {
    from : 'onboarding@resend.dev' ,
    name : "Acme"
}