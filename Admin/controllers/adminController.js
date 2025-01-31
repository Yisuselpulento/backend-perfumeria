export const profileAdmin = (req, res) => {
    try {
      
        res.status(200).json({
            success: true,
            message: "Bienvenido, administrador",
            adminData: {
                userId: req.userId,
                isAdmin: req.isAdmin,
                timestamp: new Date(),
            },
        });
    } catch (error) {
        console.error("Error in profileAdmin:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};