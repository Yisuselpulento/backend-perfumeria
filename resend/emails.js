import { sendEmail, sender } from "./resend.config.js";

const emailTest = 'delivered@resend.dev'

export const sendVerificationEmail = async (email, fullName, verificationToken) => {
  const msg = {
    from: `${sender.name} <${sender.from}>`,
    to: [email],
    subject: "Verifica tu cuenta – Mori Akuma",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Hola ${fullName},</h2>

        <p>
          Gracias por registrarte en <strong>Mori Akuma</strong>.
        </p>

        <p>
          Para confirmar tu cuenta, ingresa el siguiente código:
        </p>

        <div style="
          text-align: center;
          margin: 24px 0;
          padding: 16px;
          background: #f4f4f5;
          border-radius: 8px;
        ">
          <span style="
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #6d28d9;
          ">
            ${verificationToken}
          </span>
        </div>

        <p>
          Este código es válido por 24 horas.
        </p>

        <p style="color: #555;">
          Si no realizaste este registro, puedes ignorar este correo.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendWelcomeEmail = async (email, fullName) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Bienvenido a Mori Akuma",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Hola ${fullName},</h2>

        <p>
          Tu cuenta en <strong>Mori Akuma</strong> ha sido creada correctamente.
        </p>

        <p>
          Ya puedes explorar nuestra selección de decants y perfumes, y realizar tus compras cuando quieras.
        </p>

        <div style="margin: 24px 0;">
          <a
            href="${process.env.CLIENT_URL}"
            style="
              display: inline-block;
              background-color: #6d28d9;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Ir a la tienda
          </a>
        </div>

        <p style="color: #555;">
          Si tienes alguna duda, puedes responder a este correo.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Restablecer contraseña – Mori Akuma",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Restablecer contraseña</h2>

        <p>
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Mori Akuma</strong>.
        </p>

        <p>
          Haz clic en el botón para crear una nueva contraseña:
        </p>

        <div style="margin: 24px 0;">
          <a
            href="${resetURL}"
            style="
              display: inline-block;
              background-color: #6d28d9;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Restablecer contraseña
          </a>
        </div>

        <p>
          Este enlace es válido por <strong>1 hora</strong>.
        </p>

        <p style="color: #555;">
          Si no solicitaste este cambio, puedes ignorar este correo.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendResetSuccessEmail = async (email) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Contraseña actualizada – Mori Akuma",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Contraseña actualizada</h2>

        <p>
          Tu contraseña fue cambiada correctamente.
        </p>

        <p>
          Ya puedes iniciar sesión con tu nueva contraseña cuando quieras.
        </p>

        <p style="color: #555;">
          Si no realizaste este cambio, te recomendamos contactar con nosotros de inmediato.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendOrderDeliveredEmail = async (email, fullName, orderId) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Tu pedido ya fue entregado 🖤",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Pedido entregado</h2>

        <p>
          Hola ${fullName},
        </p>

        <p>
          Tu pedido <strong>#${orderId}</strong> fue entregado con éxito.
        </p>

        <p>
          Esperamos que disfrutes tu fragancia. Gracias por confiar en <strong>Mori Akuma</strong>.
        </p>

        <p style="margin-top: 20px;">
          Si tienes alguna duda o problema con tu pedido, puedes contactarnos respondiendo este correo.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendDiscountDayEmail = async (email, fullName) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Hoy es día de descuento en Mori Akuma 🖤",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Día de descuento</h2>

        <p>
          Hola ${fullName},
        </p>

        <p>
          Hoy tienes descuentos especiales en decants seleccionados de
          <strong>Mori Akuma</strong>.
        </p>

        <p>
          Es una buena oportunidad para probar nuevas fragancias o
          reponer tu favorita.
        </p>

        <div style="margin: 24px 0;">
          <a
            href="${process.env.CLIENT_URL}/storage"
            style="
              display: inline-block;
              background-color: #6d28d9;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Ver descuentos
          </a>
        </div>

        <p style="color: #555;">
          Promoción válida por tiempo limitado.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};

export const sendProductBackInStockEmail = async (
  email,
  fullName,
  productName,
  productId
) => {
  const msg = {
    to: [email],
    from: `${sender.name} <${sender.from}>`,
    subject: "Tu producto ya volvió a stock 🖤",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin-bottom: 10px;">Producto disponible nuevamente</h2>

        <p>
          Hola ${fullName},
        </p>

        <p>
          El producto que solicitaste, <strong>${productName}</strong>,
          ya se encuentra nuevamente disponible en <strong>Mori Akuma</strong>.
        </p>

        <p>
          Si aún te interesa, puedes ir a la tienda y realizar tu compra antes
          de que se agote.
        </p>

        <div style="margin: 24px 0;">
          <a
            href="${process.env.CLIENT_URL}/product/${productId}"
            style="
              display: inline-block;
              background-color: #6d28d9;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Ver producto
          </a>
        </div>

        <p style="margin-top: 20px;">
          Gracias por confiar en <strong>Mori Akuma</strong>.
        </p>

        <hr style="margin: 30px 0;" />

        <p style="font-size: 14px; color: #777;">
          Mori Akuma<br />
          Decants & Perfumes
        </p>
      </div>
    `,
  };

  await sendEmail(msg);
};
