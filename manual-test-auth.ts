import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './src/modules/auth/services/auth.service';
import { UserRepository } from './src/modules/user/repositories';
import { JwtService } from '@nestjs/jwt';

async function testAuthService() {
  console.log('🧪 Starting Auth Service Manual Tests...\n');

  // You'll need to provide your actual dependencies here
  // This is a template - adjust based on your actual setup

  const app = await Test.createTestingModule({
    providers: [
      AuthService,
      // Add your actual providers here
      {
        provide: UserRepository,
        useValue: {
          // Mock implementations or use real repository
        },
      },
      {
        provide: JwtService,
        useValue: {
          signAsync: async (payload: any) => 'test.jwt.token',
        },
      },
    ],
  }).compile();

  const authService = app.get<AuthService>(AuthService);

  // Test 1: Valid login
  console.log('📝 Test 1: Valid Login');
  try {
    const result = await authService.validateUser({
      phone: '1234567890',
      password: 'password123',
    });
    console.log('✅ Result:', result);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Invalid login
  console.log('\n📝 Test 2: Invalid Login');
  try {
    const result = await authService.validateUser({
      phone: '1234567890',
      password: 'wrongpassword',
    });
    console.log('✅ Result:', result);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Logout
  console.log('\n📝 Test 3: Logout');
  try {
    const result = await authService.logout({ id: '1', name: 'Test User' });
    console.log('✅ Result:', result);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎉 Manual tests completed!');
}

// Run the tests
testAuthService().catch(console.error);
