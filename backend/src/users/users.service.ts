import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findAll() {
    const users = await this.usersRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
    return users.map((u) => this.toSafeUser(u));
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { username: dto.username }],
    });
    if (existing) {
      throw new ConflictException('User with given email or username already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const roles = await this.resolveRoles(dto.roles);

    const user = this.usersRepository.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      roles,
    });

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Email already in use');
      user.email = dto.email;
    }
    if (dto.username && dto.username !== user.username) {
      const existing = await this.usersRepository.findOne({ where: { username: dto.username } });
      if (existing) throw new ConflictException('Username already in use');
      user.username = dto.username;
    }
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (dto.roles !== undefined) {
      user.roles = await this.resolveRoles(dto.roles);
    }

    const saved = await this.usersRepository.save(user);
    return this.toSafeUser(saved);
  }

  async remove(id: string) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  private async resolveRoles(roleNames?: string[]): Promise<Role[]> {
    if (!roleNames || roleNames.length === 0) return [];
    return this.rolesRepository.find({
      where: roleNames.map((name) => ({ name })),
    });
  }

  private toSafeUser(user: User) {
    const { passwordHash: _, ...safe } = user;
    return {
      ...safe,
      roles: user.roles?.map((r) => r.name) ?? [],
    };
  }
}
