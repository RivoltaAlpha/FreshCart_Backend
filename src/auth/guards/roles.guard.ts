import { Reflector } from '@nestjs/core';
import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/users/dto/create-user.dto';
import { ROLES_KEY } from '../decorators/role.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector, // This is the Reflector service used to access metadata
    @InjectRepository(User) 
    private userRepository: Repository<User>, 
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // If no roles are defined, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // If no user is found, deny access
    }

    // fetch user from the db 
    const verifiedUser = await this.userRepository.findOne({
        where: { user_id: user.user_id },
        select: ['user_id', 'email', 'role'], // Select only the necessary fields
        });

    // If the user is not found in the database, deny access
    if (!verifiedUser) {
      return false;
    }

    // Check if the user's role matches any of the required roles
    console.log('Verified user:', verifiedUser);
    return requiredRoles.some((role) => verifiedUser.role === role);
  }


    // use access token to get user roles 

}
