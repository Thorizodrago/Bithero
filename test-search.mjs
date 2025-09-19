// Test script to create sample users for search testing
// Import from our actual firebase config to ensure consistency
import { db } from './src/firebase.ts';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

async function createTestUsers() {
  const testUsers = [
    {
      realName: 'Ahmet Demir',
      realNameLower: 'ahmet demir',
      username: 'ahmetdemir',
      usernameLower: 'ahmetdemir',
      email: 'ahmet@test.com',
      stacksAddress: 'SP1234567890ABCDEF1234567890ABCDEF12345678',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      realName: 'Ayşe Yılmaz',
      realNameLower: 'ayşe yılmaz',
      username: 'ayseyilmaz',
      usernameLower: 'ayseyilmaz',
      email: 'ayse@test.com',
      stacksAddress: 'SP2ABCDEF1234567890ABCDEF1234567890ABCDEF',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    },
    {
      realName: 'Mehmet Kaya',
      realNameLower: 'mehmet kaya',
      username: 'mehmetkaya',
      usernameLower: 'mehmetkaya',
      email: 'mehmet@test.com',
      stacksAddress: 'SP3567890ABCDEF1234567890ABCDEF1234567890',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }
  ];

  try {
    for (const user of testUsers) {
      const docRef = await addDoc(collection(db, 'users'), user);
      console.log('Test user created with ID:', docRef.id);
    }
    console.log('All test users created successfully!');
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();