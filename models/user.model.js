import mongoose from "mongoose"

const { Schema } = mongoose;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
         trim: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    fullName: {
        type: String,
        minlength: 3,
        trim: true,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
      },
    isAdmin: {
        type: Boolean,
        default: false, 
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastVerificationTokenSentAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
        type: Number,
        default: 0, 
      },
      lockUntil: {
        type: Date, 
      },
      lastEditAt: {
        type: Date,
        default: new Date(0), 
      },
         stamps: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    card: {
        type: Boolean,
        default: false
    },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }], 
    notificationsCount: { type: Number, default: 0 },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
},{timestamps: true})

export const User = mongoose.model("User", userSchema)