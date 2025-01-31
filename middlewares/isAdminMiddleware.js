export const isAdminMiddleware = (req, res, next) => { 
    if (!req.isAdmin) {
        return res.status(403).json({ success: false, message: "Acceso Denegado - Solo Administradores " });
    }
    next(); 
};