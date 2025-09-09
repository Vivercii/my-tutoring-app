import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          select: {
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
            role: true,
            inviteKey: true,
            isActive: true,
            isAdmin: true,
            isPremium: true,
            premiumSince: true,
            premiumValidUntil: true,
            createdAt: true,
            updatedAt: true
          }
        })

        if (!user || !user.hashedPassword) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.hashedPassword)

        if (!isPasswordValid) {
          return null
        }

        // Check if account is disabled
        if (!user.isActive) {
          throw new Error('ACCOUNT_DISABLED')
        }

        // Return user object without password
        const { hashedPassword, ...userWithoutPassword } = user
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          inviteKey: user.inviteKey,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          isPremium: user.isPremium,
          premiumSince: user.premiumSince?.toISOString() || null,
          premiumValidUntil: user.premiumValidUntil?.toISOString() || null,
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Check if user is active when signing in
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { isActive: true }
        })
        
        if (dbUser && !dbUser.isActive) {
          return '/account-disabled'
        }
      }
      return true
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.inviteKey = token.inviteKey as string | null
        session.user.isActive = token.isActive as boolean
        session.user.isPremium = token.isPremium as boolean
        session.user.premiumSince = token.premiumSince as string | null
        session.user.premiumValidUntil = token.premiumValidUntil as string | null
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.inviteKey = (user as any).inviteKey
        token.isActive = (user as any).isActive
        token.isAdmin = (user as any).isAdmin
        token.isPremium = (user as any).isPremium
        token.premiumSince = (user as any).premiumSince
        token.premiumValidUntil = (user as any).premiumValidUntil
      }
      
      // Update token if user data changes
      if (trigger === 'update' && session?.user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            inviteKey: true,
            isActive: true,
            isAdmin: true,
            isPremium: true,
            premiumSince: true,
            premiumValidUntil: true
          }
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.inviteKey = dbUser.inviteKey
          token.isActive = dbUser.isActive
          token.isAdmin = dbUser.isAdmin
          token.isPremium = dbUser.isPremium
          token.premiumSince = dbUser.premiumSince?.toISOString() || null
          token.premiumValidUntil = dbUser.premiumValidUntil?.toISOString() || null
        }
      }
      
      return token
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}