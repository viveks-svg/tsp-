import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest(err: any, user: any, info: any) {
    // Override the default handleRequest to NOT throw UnauthorizedException.
    // If user is valid, return the user. Otherwise, return null instead of throwing.
    return user || null;
  }
}
