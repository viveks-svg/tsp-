import { Injectable, OnModuleInit, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { App, initializeApp, cert } from "firebase-admin/app";
import { getAuth, DecodedIdToken } from "firebase-admin/auth";

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firebaseApp!: App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const projectId = this.configService.get<string>("firebase.projectId");
    const clientEmail = this.configService.get<string>("firebase.clientEmail");
    let privateKey = this.configService.get<string>("firebase.privateKey");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Firebase configuration is incomplete. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.",
      );
    }

    // Replace escaped newlines with actual newlines if configured in env string
    privateKey = privateKey.replace(/\\n/g, "\n");

    // Remove wrapping quotes if present (which can happen with double-quoted values in env files)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    privateKey = privateKey.trim();

    try {
      this.firebaseApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error: any) {
      throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      return await getAuth(this.firebaseApp).verifyIdToken(idToken);
    } catch (error: any) {
      throw new UnauthorizedException(`Invalid Firebase ID token: ${error.message}`);
    }
  }
}
