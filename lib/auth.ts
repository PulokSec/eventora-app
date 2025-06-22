import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { NextRequest } from "next/server"
import { connectToDatabase } from "./mongodb"
import { ObjectId } from "mongodb"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "user"
  status: "active" | "suspended"
  createdAt: Date
  updatedAt: Date
}

export interface JWTPayload {
  userId: string
  email: string
  role: "admin" | "user"
  iat?: number
  exp?: number
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(token: string): Promise<User | null> {
  const payload = verifyToken(token)
  if (!payload) return null

  const { db } = await connectToDatabase()
  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) })

  return user as User | null
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: User | null; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || request.cookies.get("event_auth_token")?.value

    if (!token) {
      return { user: null, error: "No token provided" }
    }

    const user = await getUserFromToken(token)
    if (!user) {
      return { user: null, error: "Invalid token" }
    }

    if (user.status === "suspended") {
      return { user: null, error: "Account suspended" }
    }

    return { user }
  } catch (error) {
    return { user: null, error: "Authentication failed" }
  }
}

export async function requireAuth(
  request: NextRequest,
  requiredRole?: "admin" | "user",
): Promise<{ user: User | null; error?: string }> {
  const { user, error } = await authenticateRequest(request)

  if (error || !user) {
    return { user: null, error: error || "Authentication required" }
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return { user: null, error: "Insufficient permissions" }
  }

  return { user }
}
