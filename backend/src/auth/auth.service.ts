import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    this.refreshSecret =
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      'development_refresh_secret';
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException(
        'User with given email or username already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let roles: Role[] = [];
    if (dto.roles && dto.roles.length > 0) {
      roles = await this.rolesRepository.find({
        where: dto.roles.map((name) => ({ name })),
      });
    } else {
      const userCount = await this.usersRepository.count();
      if (userCount === 0) {
        // First user gets ADMIN so the owner can set up Kenbon
        const adminRole = await this.rolesRepository.findOne({
          where: { name: 'ADMIN' },
        });
        if (adminRole) roles = [adminRole];
      } else {
        // New registrations get CUSTOMER by default so they see Dashboard and Menu
        const customerRole = await this.rolesRepository.findOne({
          where: { name: 'CUSTOMER' },
        });
        if (customerRole) roles = [customerRole];
      }
    }

    const user = this.usersRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      roles,
      isEmailVerified: false, // Customers need email verification
    });

    const saved = await this.usersRepository.save(user);

    // Only send verification email for customers (not staff)
    const isCustomer = roles.some((role) => role.name === 'CUSTOMER');
    if (isCustomer) {
      const token = await this.emailService.createVerificationToken(saved);
      await this.emailService.sendVerificationEmail(saved.email, token);

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
        user: {
          id: saved.id,
          email: saved.email,
          username: saved.username,
          roles: saved.roles?.map((r) => r.name) ?? [],
          isEmailVerified: saved.isEmailVerified,
        },
      };
    }

    // Staff accounts don't need verification
    return this.buildTokenResponse(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: [
        { email: dto.usernameOrEmail },
        { username: dto.usernameOrEmail },
      ],
      relations: ['roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check email verification for customers
    const isCustomer = user.roles.some((role) => role.name === 'CUSTOMER');
    if (isCustomer && !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    return this.buildTokenResponse(user);
  }

  async refresh(dto: RefreshDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.refreshSecret,
      }) as { sub: string };
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
        relations: ['roles'],
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.buildTokenResponse(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private buildTokenResponse(user: User) {
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles?.map((r) => r.name) ?? [],
        isEmailVerified: user.isEmailVerified,
      },
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
      relations: ['roles'],
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.emailService.clearVerificationToken(user);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });

    if (!user) {
      throw new BadRequestException('User with this email does not exist');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const isCustomer = user.roles.some((role) => role.name === 'CUSTOMER');
    if (!isCustomer) {
      throw new BadRequestException(
        'Only customer accounts require email verification',
      );
    }

    const token = await this.emailService.createVerificationToken(user);
    await this.emailService.sendVerificationEmail(user.email, token);

    return { message: 'Verification email sent. Please check your inbox.' };
  }
}
