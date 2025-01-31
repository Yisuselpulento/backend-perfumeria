import { User } from "../../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js.js"
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../../resend/emails.js"
import crypto from "crypto"
import { isValidDate } from "../utils/validateDate.js"

const LOCK_TIME = 15 * 60 * 1000; 
const MAX_ATTEMPTS = 5;

export const signup = async (req,res) => {

     const {email,password, sexo, birthDate, username } = req.body

    try {
        if(!email || !password  || !sexo  || !birthDate || !username) {
			return res.status(400).json({ success: false, message: "Todos los campos son requeridos." });
        }

		if (!isValidDate(birthDate)) {
            return res.status(400).json({ success: false, message: "Fecha de nacimiento inválida." });
        }

		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({ success: false, message: "Formato de email inválido." });
		}

		if (username.length < 3 || username.length > 10) {
            return res.status(400).json({
                success: false,
                message: "El Username debe tener entre 3 y 10 caracteres",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres." });
        }


		const date = new Date(birthDate);
        if (
            isNaN(date.getTime()) ||
            date.toISOString().split('T')[0] !== birthDate || 
            date > new Date() 
        ) {
			return res.status(400).json({ success: false, message: "Fecha de nacimiento inválida." });
        }

		const ageLimit = 13;
			const age = new Date().getFullYear() - date.getFullYear();
			if (age < ageLimit) {
				return res.status(400).json({ success: false, message: "Debes ser mayor de 13 años." });
			}

        const userAlredyExist = await User.findOne({email})
        if(userAlredyExist) {
            return res.status(409).json({success:false, message:"El email ya existe"})
        }
;
        const hashedPassword = await bcrypt.hash(password,10)
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString()


        const user = new User({
            email,
            password: hashedPassword,
            sexo,
			username,
			birthDate,
            verificationToken,
            verificationTokenExpiresAt : Date.now() + 24 * 60 * 60 * 1000
        })

          await user.save()  

        await sendVerificationEmail(user.email, user.username, verificationToken)  

        res.status(201).json({
            success: true,
            message: "Usuario creado exitosamente",
            user: {
                ...user._doc,
                password: undefined
            } 
        })
    } catch (error) {
        res.status(500).json({success:false, message: error.message})
    } 
}

export const verifyEmail = async (req,res)=>{

    const { code } = req.body;

	try {
		if (!code || typeof code !== "string") {
            return res.status(400).json({ success: false, message: "Código de verificación inválido." });
        }

		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(401).json({ success: false, message: "Token invalido a expirado." });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpiresAt = undefined;
		await user.save();

		 await sendWelcomeEmail(user.email, user.username);

		res.status(200).json({
			success: true,
			message: "Email verificado exitosamente",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("error en verificar Email ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
}

export const login = async (req,res) => {

    const { email, password  } = req.body;
	try {

		if (!email || !password) {
			return res.status(400).json({ success: false, message: "Por favor, ingrese correo y contraseña" });
		  }

		  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: "Formato de email inválido." 
            });
        }

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "Usuario o password incorrecto" });
		}

		if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(400).json({
                success: false,
                message: `Intenta nuevamente después de ${new Date(user.lockUntil).toLocaleTimeString()}`,
            });
        }

		const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= MAX_ATTEMPTS) {
                user.lockUntil = Date.now() + LOCK_TIME;
                user.loginAttempts = 0; 
            }
            await user.save();

            return res.status(400).json({ success: false, message: "Usuario o password incorrecto" });
        }

    
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

		generateTokenAndSetCookie(res, user)

		res.status(200).json({
			success: true,
			message: "Inicio session exitosa",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("Error al iniciar session ", error);
		res.status(500).json({ success: false, message: error.message });
	}
}

export const logout = async (req, res) => {
	try {
		if (!req.cookies?.token) {
            return res.status(401).json({ success: false, message: "No hay sesión activa." });
        }

		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			path: '/',
		});
		res.status(200).json({ success: true, message: "Sesión cerrada exitosamente." });
	} catch (error) {
		console.error("Error in logout: ", error);
		res.status(500).json({ success: false, message: "Error al cerrar la sesión." });
	}
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
			return res.status(400).json({ success: false, message: "Formato de email inválido." });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.status(404).json({ success: false, message: "Usuario no encontrado" });
		}

		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; 

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpiresAt = resetTokenExpiresAt;

		await user.save();

		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/update-password/${resetToken}`); 

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		if (!token || typeof token !== "string") {
			return res.status(400).json({ success: false, message: "Token inválido." });
		}

		if (!password || password.length < 6) {
			return res.status(400).json({ success: false, message: "La contraseña debe tener al menos 6 caracteres" });
		}

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpiresAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(401).json({ success: false, message: "Invalid or expired reset token" });
		}
		

		const hashedPassword = await bcrypt.hash(password, 10);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpiresAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email); 

		res.status(200).json({ success: true, message: "Password reset exitosamente" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

export const checkAuth = async (req, res) => {
	try {
		const user = await User.findById(req.userId).select("-password");
		if (!user) {
			return res.status(404).json({ success: false, message: "User not found" });
		}

		res.status(200).json({ success: true, user });
	} catch (error) {
		console.log("Error in checkAuth ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

export const resendVerificationToken = async (req, res) => {
    const userId = req.userId; 

    if (!userId) {
        return res.status(401).json({ success: false, message: "Usuario no autenticado." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado." });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: "Este correo ya está verificado." });
        }

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; 
        await user.save();

       
        await sendVerificationEmail(user.email, user.username, verificationToken);
 
        res.status(200).json({
            success: true,
            message: "Nuevo token de verificación enviado a tu correo electrónico.",
        });
    } catch (error) {
        console.error("Error en resendVerificationToken:", error);
        res.status(500).json({ success: false, message: "Error del servidor." });
    }
};