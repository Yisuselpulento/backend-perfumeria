import { User } from "../../models/user.model.js";

const EDIT_INTERVAL = 24 * 60 * 60 * 1000;

export const editUser = async (req, res) => {
    const { username, email, nationality } = req.body;

    try {
        const currentUser = await User.findById(req.userId);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }
        
        const now = new Date();
        const timeSinceLastEdit = now - currentUser.lastEditAt;
        if (timeSinceLastEdit < EDIT_INTERVAL) {
            const remainingTime = ((EDIT_INTERVAL - timeSinceLastEdit) / (60 * 60 * 1000)).toFixed(2); 
            return res.status(400).json({
                success: false,
                message: `Debes esperar ${remainingTime} horas para editar tu perfil nuevamente.`,
            });
        }


        if (username && (username.length < 3 || username.length > 10)) {
            return res.status(400).json({
                success: false,
                message: "El nombre de usuario debe tener entre 3 y 10 caracteres",
            });
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "El email no es válido",
            });
        }

        if (email) {
            const emailExists = await User.findOne({ email });
            if (emailExists && emailExists._id.toString() !== req.userId) {
                return res.status(400).json({
                    success: false,
                    message: "El email ya está en uso por otro usuario",
                });
            }
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (nationality) updateData.nationality = nationality;

        updateData.lastEditAt = now;

        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado",
            });
        }

        res.status(200).json({
            success: true,
            message: "Usuario actualizado exitosamente",
            user: {
                ...updatedUser._doc,
                password: undefined
            },
        });
    } catch (error) {
        console.error("Error en editUser:", error);
        res.status(500).json({
            success: false,
            message: "Error del servidor",
        });
    }
};