#!/usr/bin/env node

/**
 * Test script for AI Audio Analysis Integration
 * 
 * This script demonstrates the usage of the AI analysis module
 * and tests both test mode and real API mode (if API key is available).
 */

const AudioAnalyzer = require('./ai-analysis-integration');
const path = require('path');

async function runTests() {
  console.log('🧪 AI Audio Analysis - Test Suite\n');
  console.log('=' .repeat(50));

  // Test 1: Test Mode (no API key required)
  console.log('\n📝 Test 1: Test Mode Analysis');
  console.log('-'.repeat(50));
  try {
    const analyzer = new AudioAnalyzer({ testMode: true });
    const result = await analyzer.analyze('assets/tag.mp3', 'tag.mp3');
    
    console.log('✅ Result:', result.success ? 'SUCCESS' : 'FAILED');
    console.log('   File:', result.fileName);
    console.log('   BPM:', result.analysis.bpm);
    console.log('   Key:', result.analysis.key);
    console.log('   Genre:', result.analysis.genre);
    console.log('   Mood:', result.analysis.mood);
    console.log('   Tags:', result.analysis.tags.join(', '));
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test 2: Real API Mode (requires GEMINI_API_KEY)
  console.log('\n📝 Test 2: Real API Analysis');
  console.log('-'.repeat(50));
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️  Skipping: GEMINI_API_KEY not set');
    console.log('   Set GEMINI_API_KEY environment variable to test real API');
  } else {
    try {
      const analyzer = new AudioAnalyzer();
      const result = await analyzer.analyze('assets/tag.mp3', 'tag.mp3');
      
      console.log('Result:', result.success ? '✅ SUCCESS' : '⚠️  FAILED (network/API issue)');
      console.log('   File:', result.fileName);
      console.log('   BPM:', result.analysis.bpm);
      console.log('   Key:', result.analysis.key);
      console.log('   Genre:', result.analysis.genre);
      
      if (!result.success) {
        console.log('   Error:', result.error);
        console.log('   Note: Network errors are expected in sandboxed environments');
      }
    } catch (error) {
      console.error('❌ Test 2 failed:', error.message);
    }
  }

  // Test 3: Error Handling - Non-existent file
  console.log('\n📝 Test 3: Error Handling (Non-existent file)');
  console.log('-'.repeat(50));
  try {
    const analyzer = new AudioAnalyzer({ testMode: true });
    const result = await analyzer.analyze('non-existent-file.mp3', 'test.mp3');
    
    console.log('Result:', result.success ? '✅ SUCCESS' : '⚠️  FAILED (expected)');
    console.log('   Error:', result.error);
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test suite completed\n');
  console.log('Usage examples:');
  console.log('  - Test mode: node test-ai-analysis.js');
  console.log('  - With API: GEMINI_API_KEY=your-key node test-ai-analysis.js');
  console.log('\nAPI Documentation: See AI_ANALYSIS_README.md for more details\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
