import { sendEmail, sender } from "./resend.config.js";

const emailTest = 'delivered@resend.dev'

export const sendVerificationEmail = async (email,userName, verificationToken) => {
    const msg = {
      from:  `${sender.name} <${sender.from}>`,
      to: [emailTest], 
      subject: "¡Estás a un paso de ser parte de algo grande!",
      html: `
       <p>Hola ${userName},</p>
  <p>¡Qué emoción verte aquí! Estás a punto de unirte a una comunidad que está transformando el aprendizaje y las oportunidades de crecimiento. En Bull Investing, creemos en el poder de las decisiones inteligentes y en el impacto que juntos podemos crear.</p>
  <p>Para completar tu registro, utiliza el siguiente código provisorio:</p>
  <div style="text-align: center; margin: 30px 0;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6d28d9;">${verificationToken}</span>
  </div>
  <p>Este código es tu llave para abrir las puertas a un mundo lleno de conocimiento, herramientas y una comunidad que te respalda en cada paso.</p>
  <p>Si no fuiste tú quien solicitó esta acción, por favor ignora este mensaje.</p>
  <p>¡Estamos ansiosos de darte la bienvenida!</p>
  <p>Con entusiasmo,<br>El equipo de Bull Investing Limitada.</p>
      `,
    };
  
    await sendEmail(msg);
  };

  export const sendWelcomeEmail = async (email, userName) => {
    const msg = {
      to: [emailTest],
      from:  `${sender.name} <${sender.from}>`,
      subject: "¡Bienvenido/a a Bull Investing!",
      html: `
      <p>Hola ${userName},</p>
      <p>¡Es oficial! Ahora formas parte de una comunidad increíblemente apasionada por aprender, crecer y lograr grandes cosas. Tu cuenta ha sido creada exitosamente, y estamos encantados de tenerte con nosotros.</p>
      <p>En Bull Investing, no solo eres un usuario más; eres una pieza clave de un movimiento que busca transformar el conocimiento en poder y las oportunidades en logros.</p>
      <p>Aquí tienes algunos pasos para empezar:</p>
      <ul>
        <li>Accede a tu cuenta aquí: <a href="${process.env.CLIENT_URL}">[Enlace de inicio de sesión]</a>.</li>
        <li>Explora nuestra plataforma y descubre todo lo que hemos preparado para ti.</li>
        <li>Únete a nuestra comunidad y comienza tu viaje hacia el éxito.</li>
      </ul>
      <p>Si necesitas algo, estamos siempre a tu disposición en <a href="mailto:Bull.investing@proton.me">Bull.investing@proton.me</a>.</p>
      <p>Gracias por confiar en nosotros. Esto es solo el comienzo de algo increíble.</p>
      <p>Con entusiasmo y compromiso,<br>El equipo de Bull Investing Limitada</p>
    `,
    };
  
    await sendEmail(msg);
  };

  export const sendPasswordResetEmail = async (email, resetURL) => {
    const msg = {
      to: [emailTest],
      from:  `${sender.name} <${sender.from}>`,
      subject: "¡Recuperemos tu acceso",
      html: `
        <p>Hola</p>
        <p>Sabemos que a veces las cosas pueden complicarse, ¡pero estamos aquí para ayudarte! Porque eres una parte esencial de nuestra comunidad, queremos asegurarnos de que vuelvas a conectar con nosotros lo más pronto posible.</p>
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
        </div>
        <p>Este es solo un pequeño recordatorio de que siempre tendrás un lugar seguro en Bull Investing, donde juntos hacemos posible el éxito.</p>
        <p>Este enlace expirará en 1 hora por razones de seguridad.</p>
       <p>Con dedicación,<br>El equipo de Bull Investing Limitada</p>
      `,
    };
  
    await sendEmail(msg);
  };

  export const sendResetSuccessEmail = async (email) => {
    const msg = {
      to: [emailTest],
      from:  `${sender.name} <${sender.from}>`,
      subject: "¡Tu acceso está listo!",
      html: `
      <p>Hola </p>
      <p>¡Buenas noticias! Tu contraseña ha sido actualizada con éxito. Ahora estás listo para continuar explorando, aprendiendo y logrando grandes juntos.</p>
      <p>Recuerda que siempre estaremos aquí para apoyarte, porque en Bull Investing no solo encuentras conocimiento, sino también un lugar donde perteneces.</p>
      <p>¡Gracias por confiar en nosotros!</p>
      <p>Con aprecio,<br>El equipo de Bull Investing Limitada</p>
    `,
    };
  
    await sendEmail(msg);
  };