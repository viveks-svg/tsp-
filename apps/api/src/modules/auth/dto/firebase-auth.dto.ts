import { IsString, IsNotEmpty } from "class-validator";

export class FirebaseAuthDto {
  @IsString()
  @IsNotEmpty({ message: "Firebase ID token is required" })
  idToken!: string;
}
