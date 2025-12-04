import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// ============================================
//  CONEXION TWILO
// ============================================

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const enviarWhatsApp = async (mensaje, numeroDestino) => {
  try {
    const respuesta = await client.messages.create({
      body: mensaje,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${numeroDestino}`
    });

    console.log("Mensaje enviado:", respuesta.sid);
    return true;
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);
    return false;
  }
};
