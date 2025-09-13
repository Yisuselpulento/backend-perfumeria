import { Address } from "../../models/address.model.js";
import { User } from "../../models/user.model.js";

export const addAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const { street, city, state, zip, phone, label } = req.body;

    if (!street || !city || !state || !zip || !phone || !label) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios: street, city, state, zip, phone, label"
      });
    }

    const isFirstAddress = (await Address.countDocuments({ userId })) === 0;

    const newAddress = await Address.create({
      userId,
      street,
      city,
      state,
      zip,
      phone,
      label,
      isDefault: isFirstAddress
    });

    await User.findByIdAndUpdate(userId, { $push: { addresses: newAddress._id } });

    res.status(201).json({
      success: true,
      message: "Dirección creada correctamente",
      address: newAddress
    });
  } catch (error) {
    console.error("Error al crear dirección:", error);
    res.status(500).json({ success: false, message: "Error al crear dirección" });
  }
};

export const getAddresses = async (req, res) => {
  try {
    const userId = req.userId;

    const addresses = await Address.find({ userId });

    res.json({
      success: true,
      message: "Direcciones obtenidas",
      addresses
    });
  } catch (error) {
    console.error("Error al obtener direcciones:", error);
    res.status(500).json({ success: false, message: "Error al obtener direcciones" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Debes enviar al menos un campo para actualizar"
      });
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Dirección no encontrada" });
    }

    if (updates.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    Object.assign(address, updates);
    await address.save();

    res.json({
      success: true,
      message: "Dirección actualizada correctamente",
      address
    });
  } catch (error) {
    console.error("Error al actualizar dirección:", error);
    res.status(500).json({ success: false, message: "Error al actualizar dirección" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const { addressId } = req.params;

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Dirección no encontrada" });
    }

    await Address.deleteOne({ _id: addressId });

    await User.findByIdAndUpdate(userId, { $pull: { addresses: addressId } });

    if (address.isDefault) {
      const anotherAddress = await Address.findOne({ userId });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }

    res.json({ success: true, message: "Dirección eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar dirección:", error);
    res.status(500).json({ success: false, message: "Error al eliminar dirección" });
  }
};