import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required')
                }

                await dbConnect()
                const user = await User.findOne({
                    email: credentials.email.toLowerCase().trim(),
                }).select('+password')

                if (!user) {
                    throw new Error('No account found with this email')
                }

                if (!user.password) {
                    throw new Error('Please use your social login for this account')
                }

                const isValid = await bcrypt.compare(credentials.password, user.password)
                if (!isValid) {
                    throw new Error('Incorrect password')
                }

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    subscriptionTier: user.subscriptionTier,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }: { token: Record<string, unknown>; user?: Record<string, unknown> }) {
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
                token.subscriptionTier = user.subscriptionTier
            }
            return token
        },
        async session({ session, token }: { session: Record<string, unknown>; token: Record<string, unknown> }) {
            const s = session as { user?: Record<string, unknown> }
            if (s.user) {
                s.user.id = token.id as string
                s.user.email = token.email as string
                s.user.name = token.name as string
                s.user.subscriptionTier = token.subscriptionTier as string
            }
            return session
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
}
