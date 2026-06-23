import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../database/prisma.service";
import { SignupDto, LoginDto } from "./dto/auth.dto";
import { PasswordHelper } from "../../common/utils/password.helper";
import { FirebaseService } from "../firebase/firebase.service";
import * as crypto from "crypto";

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  deviceModel?: string;
  os?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly firebaseService: FirebaseService,
  ) { }

  private async createSessionAndTokens(user: any, metadata: SessionMetadata) {
    const accessToken = this.generateToken(user);

    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: "", // Temporary placeholder
        deviceId: metadata.deviceId || null,
        deviceModel: metadata.deviceModel || null,
        os: metadata.os || null,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        expiresAt,
      },
    });

    const refreshToken = this.jwtService.sign(
      { sessionId: session.id, sub: user.id },
      { expiresIn: "30d" },
    );

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { balance: true },
    });

    return {
      accessToken,
      refreshToken,
      walletBalance: wallet?.balance ?? 0,
    };
  }

  async signup(signupDto: SignupDto, metadata: SessionMetadata) {
    const { email, password, name, role } = signupDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await PasswordHelper.hash(password);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: role || "USER",
          authProvider: "EMAIL",
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0.0,
        },
      });

      return user;
    });

    const tokens = await this.createSessionAndTokens(newUser, metadata);

    return {
      user: this.formatUser(newUser),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto, metadata: SessionMetadata) {
    const { email, password } = loginDto;


    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isPasswordValid = await PasswordHelper.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const tokens = await this.createSessionAndTokens(user, metadata);

    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebasePhone(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    const { uid, phone } = decodedToken;

    if (!phone) {
      throw new UnauthorizedException("Firebase ID Token does not contain a phone number");
    }

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      const existingUserByPhone = await this.prisma.user.findUnique({
        where: { phone: phone },
      });

      if (existingUserByPhone) {
        user = await this.prisma.user.update({
          where: { id: existingUserByPhone.id },
          data: {
            firebaseUid: uid,
            authProvider: "PHONE",
          },
        });
      } else {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              phone: phone,
              firebaseUid: uid,
              authProvider: "PHONE",
              name: "Phone User",
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebaseGoogle(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new UnauthorizedException("Firebase ID Token does not contain an email address");
    }

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUserByEmail) {
        user = await this.prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: {
            firebaseUid: uid,
            authProvider: "GOOGLE",
            name: existingUserByEmail.name || name || null,
            avatarUrl: existingUserByEmail.avatarUrl || picture || null,
          },
        });
      } else {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email,
              firebaseUid: uid,
              authProvider: "GOOGLE",
              name: name || "Google User",
              avatarUrl: picture || null,
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async loginWithFirebaseApple(idToken: string, metadata: SessionMetadata) {
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let user = await this.prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      if (email) {
        const existingUserByEmail = await this.prisma.user.findUnique({
          where: { email },
        });

        if (existingUserByEmail) {
          user = await this.prisma.user.update({
            where: { id: existingUserByEmail.id },
            data: {
              firebaseUid: uid,
              authProvider: "APPLE",
              name: existingUserByEmail.name || name || null,
            },
          });
        }
      }

      if (!user) {
        user = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: email || null,
              firebaseUid: uid,
              authProvider: "APPLE",
              name: name || "Apple User",
              role: "USER",
            },
          });

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0.0,
            },
          });

          return newUser;
        });
      }
    }

    const tokens = await this.createSessionAndTokens(user, metadata);
    return {
      user: this.formatUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string, metadata: SessionMetadata) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (err) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const sessionId = payload.sessionId;
    if (!sessionId) {
      throw new UnauthorizedException("Invalid refresh token payload");
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }

    // Hash incoming refresh token and compare to prevent replay attacks
    const incomingHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    if (session.refreshTokenHash !== incomingHash) {
      // Refresh token reuse detected! Revoke all user sessions immediately for safety.
      await this.prisma.userSession.updateMany({
        where: { userId: session.userId },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException("Token reuse detected. All sessions revoked");
    }

    // Revoke old session and issue a new one (Token Rotation)
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newTokens = await this.createSessionAndTokens(session.user, metadata);

    return {
      user: this.formatUser(session.user),
      ...newTokens,
    };
  }

  async getSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        deviceModel: true,
        os: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new UnauthorizedException("Session not found or access denied");
    }

    return this.prisma.userSession.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });
  }

  private generateToken(user: { id: string; email: string | null; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.jwtService.sign(payload);
  }

  private formatUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      firebaseUid: user.firebaseUid,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}


