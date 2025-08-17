import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserRepository } from '../../user/repositories';
import { Generation } from '../../../common/utilities/generation';
import { UserSignInRequestDto, UserChangePasswordRequestDto } from '../../../common/dto';

// Mock the Generation utility
jest.mock('../../../common/utilities/generation');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  // Mock user data
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    password: 'hashedPassword123',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSignInData: UserSignInRequestDto = {
    phone: '1234567890',
    password: 'plainPassword123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            getUserForSignIn: jest.fn(),
            checkExistsUser: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return access token when credentials are valid', async () => {
      // Arrange
      const mockToken = 'mock.jwt.token';
      userRepository.getUserForSignIn.mockResolvedValue(mockUser);
      (Generation.comparePassword as jest.Mock).mockReturnValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);

      // Act
      const result = await service.validateUser(mockSignInData);

      // Assert
      expect(userRepository.getUserForSignIn).toHaveBeenCalledWith(mockSignInData.phone);
      expect(Generation.comparePassword).toHaveBeenCalledWith(mockSignInData.password, mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        id: mockUser.id,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        name: mockUser.name,
        status: mockUser.status,
        email: mockUser.email,
      });
      expect(result).toEqual({ accessToken: mockToken });
    });

    it('should return null when user is not found', async () => {
      // Arrange
      userRepository.getUserForSignIn.mockResolvedValue(null);

      // Act
      const result = await service.validateUser(mockSignInData);

      // Assert
      expect(userRepository.getUserForSignIn).toHaveBeenCalledWith(mockSignInData.phone);
      expect(Generation.comparePassword).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      // Arrange
      userRepository.getUserForSignIn.mockResolvedValue(mockUser);
      (Generation.comparePassword as jest.Mock).mockReturnValue(false);

      // Act
      const result = await service.validateUser(mockSignInData);

      // Assert
      expect(userRepository.getUserForSignIn).toHaveBeenCalledWith(mockSignInData.phone);
      expect(Generation.comparePassword).toHaveBeenCalledWith(mockSignInData.password, mockUser.password);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const user = { id: '1', name: 'John', email: 'john@example.com' };

      // Act
      const result = await service.getProfile(user);

      // Assert
      expect(result).toEqual(user);
    });
  });

  describe('changePassword', () => {
    const mockChangePasswordData: UserChangePasswordRequestDto = {
      phone: '1234567890',
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
      confirmPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      // Arrange
      userRepository.getUserForSignIn.mockResolvedValue(mockUser);
      (Generation.comparePassword as jest.Mock).mockReturnValue(true);
      (Generation.encodePassword as jest.Mock).mockReturnValue('newHashedPassword');

      // Act
      const result = await service.changePassword(mockChangePasswordData, mockUser);

      // Assert
      expect(userRepository.getUserForSignIn).toHaveBeenCalledWith(mockUser.phone);
      expect(Generation.comparePassword).toHaveBeenCalledWith(mockChangePasswordData.oldPassword, mockUser.password);
      expect(Generation.encodePassword).toHaveBeenCalledWith(mockChangePasswordData.newPassword);
      expect(userRepository.updateUser).toHaveBeenCalledWith(null, mockUser.id, { password: 'newHashedPassword' });
      expect(result).toBe(true);
    });

    it('should return NotFoundException when user is not found', async () => {
      // Arrange
      userRepository.getUserForSignIn.mockResolvedValue(null);

      // Act
      const result = await service.changePassword(mockChangePasswordData, mockUser);

      // Assert
      expect(result).toBeInstanceOf(NotFoundException);
    });

    it('should return BadRequestException when old password is incorrect', async () => {
      // Arrange
      userRepository.getUserForSignIn.mockResolvedValue(mockUser);
      (Generation.comparePassword as jest.Mock).mockReturnValue(false);

      // Act
      const result = await service.changePassword(mockChangePasswordData, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });

    it('should return BadRequestException when passwords do not match', async () => {
      // Arrange
      const mismatchPasswordData = {
        ...mockChangePasswordData,
        confirmPassword: 'differentPassword',
      };
      userRepository.getUserForSignIn.mockResolvedValue(mockUser);
      (Generation.comparePassword as jest.Mock).mockReturnValue(true);

      // Act
      const result = await service.changePassword(mismatchPasswordData, mockUser);

      // Assert
      expect(result).toBeInstanceOf(BadRequestException);
    });
  });

  describe('register', () => {
    const mockRegisterData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0987654321',
      password: 'password123',
    };

    it('should register user successfully', async () => {
      // Arrange
      userRepository.checkExistsUser.mockResolvedValue(null);
      (Generation.encodePassword as jest.Mock).mockReturnValue('hashedPassword');
      userRepository.createUser.mockResolvedValue(undefined);

      // Act
      const result = await service.register({ ...mockRegisterData });

      // Assert
      expect(userRepository.checkExistsUser).toHaveBeenCalledWith(null, { phone: mockRegisterData.phone });
      expect(Generation.encodePassword).toHaveBeenCalledWith(mockRegisterData.password);
      expect(userRepository.createUser).toHaveBeenCalledWith(null, {
        ...mockRegisterData,
        password: 'hashedPassword',
      });
      expect(result).toBe(true);
    });

    it('should throw BadRequestException when user already exists', async () => {
      // Arrange
      userRepository.checkExistsUser.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(mockRegisterData)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      const user = { id: '1', name: 'John' };

      // Act
      const result = await service.logout(user);

      // Assert
      expect(result).toEqual({
        message: 'User logged out successfully',
        timestamp: expect.any(String),
      });
    });

    it('should throw BadRequestException when user is not provided', async () => {
      // Act & Assert
      await expect(service.logout(null)).rejects.toThrow(BadRequestException);
    });
  });
});
