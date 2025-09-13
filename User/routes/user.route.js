import express from "express";
import { verifyAuth } from "../../middlewares/verifyAuth.js";
import { addAddress, getAddresses, updateAddress, deleteAddress } from "../controllers/addressController.js";

const router = express.Router();

router.post("/address", verifyAuth, addAddress);       
router.get("/address", verifyAuth, getAddresses);       
router.put("/address/:addressId", verifyAuth, updateAddress); 
router.delete("/address/:addressId", verifyAuth, deleteAddress); 

export default router;