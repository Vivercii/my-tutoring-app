import NextAuth from 'next-auth'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.hashedPassword) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Check if this is an admin login attempt (from /admin/login page)
        // We detect this by checking the referer or a custom header
        const isAdminLogin = req?.headers?.referer?.includes('/admin/login') || 
                            req?.headers?.['x-admin-login'] === 'true'
        
        // If this is an admin login attempt, verify admin status
        if (isAdminLogin && !user.isAdmin) {
          console.error(`Admin login attempt by non-admin user: ${user.email}`)
          throw new Error('Invalid credentials')
        }

        // Check if user account is active
        if (!user.isActive) {
          console.error(`Login attempt by inactive user: ${user.email}`)
          throw new Error('Account is inactive')
        }

        // Don't update lastLoginAt here - we'll do it in the events callback
        // to avoid any authorization issues

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          inviteKey: user.inviteKey,
          isAdmin: user.isAdmin,
          isActive: user.isActive
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
        token.inviteKey = (user as any).inviteKey
        token.isAdmin = (user as any).isAdmin
        token.isActive = (user as any).isActive
        token.isPremium = (user as any).isPremium || false
        token.premiumSince = (user as any).premiumSince
        token.premiumValidUntil = (user as any).premiumValidUntil
      }

      // Handle masquerading via trigger/session update
      if (trigger === 'update') {
        if (session?.masquerading) {
          console.log('[AUTH JWT] Starting masquerade with data:', session.masquerading)
          token.masquerading = session.masquerading
        } else if (session?.masquerading === null) {
          console.log('[AUTH JWT] Clearing masquerade data')
          delete token.masquerading
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Check if we have masquerading data in the token
        if (token.masquerading && token.isAdmin) {
          console.log('[AUTH SESSION] User is masquerading, token data:', token.masquerading)
          const masqueradeData = token.masquerading as any
          
          // User is masquerading - return target user's data
          session.user.id = masqueradeData.targetUserId
          session.user.email = masqueradeData.targetUserEmail
          session.user.name = masqueradeData.targetUserName || null
          session.user.role = masqueradeData.targetUserRole
          session.user.inviteKey = masqueradeData.targetUserInviteKey
          session.user.isAdmin = false // Target user is not admin
          session.user.isActive = masqueradeData.targetUserIsActive
          session.user.masquerading = {
            originalUserId: masqueradeData.originalUserId,
            originalUserEmail: masqueradeData.originalUserEmail,
            targetUserId: masqueradeData.targetUserId,
            targetUserEmail: masqueradeData.targetUserEmail
          }
        } else {
          // Normal session
          session.user.id = token.id as string
          session.user.email = token.email as string
          session.user.name = token.name as string | null
          session.user.role = token.role as any
          session.user.inviteKey = token.inviteKey as string | null
          session.user.isAdmin = token.isAdmin as boolean
          session.user.isActive = token.isActive as boolean
          session.user.isPremium = token.isPremium as boolean || false
          session.user.premiumSince = token.premiumSince as Date | null
          session.user.premiumValidUntil = token.premiumValidUntil as Date | null
        }
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      // Update lastLoginAt timestamp when user signs in
      if (user?.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })
          console.log(`Updated lastLoginAt for user: ${user.email}`)
        } catch (error) {
          console.error('Failed to update lastLoginAt:', error)
          // Don't throw error - we don't want to block login if timestamp update fails
        }
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }