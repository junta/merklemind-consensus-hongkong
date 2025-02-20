import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @IsNotEmpty()
  pair: string;

  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
