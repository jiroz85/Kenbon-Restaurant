import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  private readonly refreshSecret: string;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly jwtService: JwtService,
  ) {
    this.refreshSecret =
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'development_refresh_secret';
  }

  async register(dto: RegisterDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });

    if (existing) {
      throw new ConflictException('User with given email or username already exists');
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
        const adminRole = await this.rolesRepository.findOne({ where: { name: 'ADMIN' } });
        if (adminRole) roles = [adminRole];
      } else {
        // New registrations get CUSTOMER by default so they see Dashboard and Menu
        const customerRole = await this.rolesRepository.findOne({ where: { name: 'CUSTOMER' } });
        if (customerRole) roles = [customerRole];
      }
    }

    const user = this.usersRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      roles,
    });

    const saved = await this.usersRepository.save(user);

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
      },
    };
  }
}
