import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: Role;
      inviteKey?: string | null;
      isAdmin: boolean;
      isActive: boolean;
      isPremium: boolean;
      premiumSince?: Date | null;
      premiumValidUntil?: Date | null;
      masquerading?: {
        originalUserId: string;
        originalUserEmail: string;
        targetUserId: string;
        targetUserEmail: string;
      };
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    inviteKey?: string | null;
    isAdmin: boolean;
    isActive: boolean;
    isPremium: boolean;
    premiumSince?: Date | null;
    premiumValidUntil?: Date | null;
    masquerading?: {
      originalUserId: string;
      originalUserEmail: string;
      targetUserId: string;
      targetUserEmail: string;
    };
  }
}