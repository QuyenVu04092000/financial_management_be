import { IsNotEmpty, IsOptional, ArrayNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { Converter } from '../../utilities/converter';

export class UserCreateRequestDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  phone: string;

  @IsOptional()
  email?: string;

  @IsNotEmpty()
  password: string;
}

export class UserCreateResponseDto {
  name: string;
  password: string;
}

export class UserGetRequestDto {
  @IsOptional()
  @Transform(({ value }) => (value ? Converter.convertStringToArray(value) : undefined), { toClassOnly: true })
  statuses: string[];

  @IsOptional()
  name?: string;

  @IsOptional()
  search: string;

  @IsOptional()
  sort: string;

  @IsOptional()
  userId: string;
}

export class UserGetResponseDto {
  id?: string;
  name?: string;
  status?: string;

  constructor(user: any) {
    this.id = user.id;
    this.name = user.name;
    this.status = user.status;
  }
}

export class UserDetailGetResponseDto {
  id?: string;
  name?: string;
  status?: string;
  phone?: string;
  email?: string;

  constructor(user: any) {
    this.id = user.id;
    this.name = user.name;
    this.status = user.status;
    this.phone = user.phone;
    this.email = user.email;
  }
}

export class UserUpdateRequestDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  password?: string;
}

export class CheckExistsUserRequestDto {
  @IsNotEmpty()
  phone: string;
}

export class UserSignInRequestDto {
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  password: string;
}

export class UserChangePasswordRequestDto {
  @IsOptional()
  phone: string;

  @IsNotEmpty()
  oldPassword: string;

  @IsNotEmpty()
  newPassword: string;

  @IsNotEmpty()
  confirmPassword: string;
}

export class UserUpdateStatusRequestDto {
  @ArrayNotEmpty()
  userIds: string[];

  @IsNotEmpty()
  status: string;
}
