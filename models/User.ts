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
    /** How many Application Packs (Lebenslauf + Anschreiben) this free user has generated */
    applicationPackCount: number
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
        applicationPackCount: { type: Number, default: 0 },
    },
    { timestamps: true }
)

// email already has unique index via unique: true
UserSchema.index({ stripeCustomerId: 1 })

// Next.js HMR can keep an older compiled User model without newer paths.
// Ensure applicationPackCount exists so $inc is not stripped by strict mode.
const ExistingUser = mongoose.models.User as mongoose.Model<IUser> | undefined
if (ExistingUser && !ExistingUser.schema.path('applicationPackCount')) {
    ExistingUser.schema.add({ applicationPackCount: { type: Number, default: 0 } })
}

export default ExistingUser || mongoose.model<IUser>('User', UserSchema)
