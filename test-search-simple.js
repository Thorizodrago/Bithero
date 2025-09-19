// Simple test to verify our search UI is working
// We'll test with a manual search first

import { searchUsers } from '../src/db.js';

// Test search functionality
console.log('Testing search functionality...');

// Test 1: Search by real name (should work with partial matches)
searchUsers('Ahmet', false).then(results => {
	console.log('Real name search results:', results);
});

// Test 2: Search by username (@ prefixed)
searchUsers('ahmet', true).then(results => {
	console.log('Username search results:', results);
});
