import { sendDiscountDayEmail } from "../../resend/emails.js";
import {User} from "../../models/user.model.js";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


export const sendDiscountBroadcast = async (req, res) => {
  try {
    const users = await User.find({
    }).select("email fullName");

    if (!users.length) {
      return res.json({
        success: false,
        message: "No hay usuarios para enviar correos",
      });
    }

    for (const user of users) {
      try {
        await sendDiscountDayEmail(user.email, user.fullName);
        sentCount++;

      
        await sleep(600);

      } catch (err) {
        console.error(`❌ Error enviando a ${user.email}`, err);
      }
    }

    res.json({
      success: true,
      message: `Correo enviado a ${users.length} usuarios`,
    });
  } catch (error) {
    console.error("❌ Error broadcast email:", error);
    res.status(500).json({
      success: false,
      message: "Error enviando correos",
    });
  }
};
