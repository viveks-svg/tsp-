import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TLSSigAPIv2 = require("tls-sig-api-v2");

@Injectable()
export class TrtcService {
  private readonly sdkAppId: number;
  private readonly secretKey: string;
  private readonly api: any;

  constructor(private readonly configService: ConfigService) {
    this.sdkAppId = this.configService.get<number>("trtc.sdkAppId", 0);
    this.secretKey = this.configService.get<string>("trtc.secretKey", "");
    this.api = new TLSSigAPIv2.Api(this.sdkAppId, this.secretKey);
  }

  /**
   * Generate a Tencent TRTC userSig for a specific user using the official library.
   */
  generateUserSig(userId: string, expireSeconds = 86400): string {
    return this.api.genSig(userId, expireSeconds);
  }

  getSdkAppId(): number {
    return this.sdkAppId;
  }
}

