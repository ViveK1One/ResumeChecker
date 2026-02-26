import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
    name: string
    email: string
    password?: string
    image?: string
    subscriptionTier: 'free' | 'pro' | 'lifetime'
    subscriptionExpiry?: Date
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    resumeCount: number
    createdAt: Date
    updatedAt: Date
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
        },
        password: { type: String, select: false }, // excluded by default
        image: { type: String },
        subscriptionTier: {
            type: String,
            enum: ['free', 'pro', 'lifetime'],
            default: 'free',
        },
        subscriptionExpiry: { type: Date },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        resumeCount: { type: Number, default: 0 },
    },
    { timestamps: true }
)

// email already has unique index via unique: true
UserSchema.index({ stripeCustomerId: 1 })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
