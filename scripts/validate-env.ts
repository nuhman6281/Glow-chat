#!/usr/bin/env tsx

import { config, validateConfig } from '../server/config/config';
import fs from 'fs';
import path from 'path';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironmentFiles() {
  const requiredFiles = ['.env', '.env.example'];
  const optionalFiles = ['.env.prod'];
  
  log('\n📁 Checking environment files...', colors.blue);
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} exists`, colors.green);
    } else {
      log(`❌ ${file} missing`, colors.red);
      return false;
    }
  }
  
  for (const file of optionalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${file} exists`, colors.green);
    } else {
      log(`⚠️  ${file} missing (optional for production)`, colors.yellow);
    }
  }
  
  return true;
}

function validateConfiguration() {
  log('\n🔧 Validating configuration...', colors.blue);
  
  try {
    validateConfig();
    log('✅ Configuration validation passed', colors.green);
    return true;
  } catch (error) {
    log(`❌ Configuration validation failed:`, colors.red);
    log(`   ${error.message}`, colors.red);
    return false;
  }
}

function checkRequiredSecrets() {
  log('\n🔐 Checking secrets...', colors.blue);
  
  const secrets = [
    { name: 'JWT_SECRET', value: config.jwtSecret, minLength: 32 },
    { name: 'SESSION_SECRET', value: config.sessionSecret, minLength: 32 }
  ];
  
  let allValid = true;
  
  for (const secret of secrets) {
    if (!secret.value) {
      log(`❌ ${secret.name} is not set`, colors.red);
      allValid = false;
    } else if (secret.value.length < secret.minLength) {
      log(`❌ ${secret.name} is too short (${secret.value.length} chars, minimum ${secret.minLength})`, colors.red);
      allValid = false;
    } else if (config.nodeEnv === 'production' && 
               (secret.value.includes('dev-') || secret.value.includes('change-in-production'))) {
      log(`❌ ${secret.name} contains development placeholder in production`, colors.red);
      allValid = false;
    } else {
      log(`✅ ${secret.name} is valid`, colors.green);
    }
  }
  
  return allValid;
}

function checkOptionalServices() {
  log('\n🛠️  Checking optional services...', colors.blue);
  
  const services = [
    {
      name: 'Cloudinary',
      required: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
      values: [config.cloudinary.cloudName, config.cloudinary.apiKey, config.cloudinary.apiSecret]
    },
    {
      name: 'Email (SMTP)',
      required: ['SMTP_USER', 'SMTP_PASS'],
      values: [config.smtp.user, config.smtp.pass]
    },
    {
      name: 'WebRTC',
      required: ['TURN_SERVER_URL', 'TURN_USERNAME', 'TURN_CREDENTIAL'],
      values: [config.webrtc.turnServerUrl, config.webrtc.turnUsername, config.webrtc.turnCredential]
    }
  ];
  
  for (const service of services) {
    const configured = service.values.every(value => value && value.trim() !== '');
    if (configured) {
      log(`✅ ${service.name} is configured`, colors.green);
    } else {
      log(`⚠️  ${service.name} is not configured (optional)`, colors.yellow);
    }
  }
}

function displayConfiguration() {
  log('\n📋 Current configuration summary:', colors.blue);
  
  const summary = [
    { label: 'Environment', value: config.nodeEnv },
    { label: 'Server Port', value: config.port.toString() },
    { label: 'Database', value: config.mongoUri },
    { label: 'Redis', value: config.redisUrl },
    { label: 'Client URL', value: config.clientUrl },
    { label: 'CORS Origin', value: config.corsOrigin },
    { label: 'Debug Mode', value: config.debug.toString() },
    { label: 'Swagger Enabled', value: config.enableSwagger.toString() }
  ];
  
  for (const item of summary) {
    log(`   ${item.label}: ${item.value}`, colors.reset);
  }
}

function generateSecretSuggestions() {
  log('\n🔑 Secret generation suggestions:', colors.blue);
  
  const generateSecret = (length: number = 64): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  
  log('For production, consider using these generated secrets:', colors.reset);
  log(`JWT_SECRET=${generateSecret(64)}`, colors.green);
  log(`SESSION_SECRET=${generateSecret(64)}`, colors.green);
  log('\n⚠️  Store these securely and never commit them to version control!', colors.yellow);
}

async function main() {
  log(`${colors.bold}🌟 Environment Configuration Validator${colors.reset}`);
  log(`${colors.bold}======================================${colors.reset}`);
  
  const checks = [
    { name: 'Environment Files', fn: validateEnvironmentFiles },
    { name: 'Configuration Loading', fn: validateConfiguration },
    { name: 'Required Secrets', fn: checkRequiredSecrets }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = check.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  // Always run these regardless of failures
  checkOptionalServices();
  displayConfiguration();
  
  if (!allPassed) {
    log('\n❌ Some validation checks failed!', colors.red);
    
    if (config.nodeEnv === 'production' || process.argv.includes('--generate-secrets')) {
      generateSecretSuggestions();
    }
    
    log('\n💡 See ENVIRONMENT.md for detailed setup instructions', colors.blue);
    process.exit(1);
  } else {
    log('\n🎉 All validation checks passed!', colors.green);
    
    if (config.nodeEnv === 'development') {
      log('\n💡 For production deployment:', colors.blue);
      log('   1. Create .env.prod with production values', colors.reset);
      log('   2. Set NODE_ENV=production', colors.reset);
      log('   3. Use strong secrets (run with --generate-secrets for suggestions)', colors.reset);
    }
    
    process.exit(0);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Environment Configuration Validator', colors.bold);
  log('');
  log('Usage: npm run validate-env [options]', colors.blue);
  log('');
  log('Options:', colors.blue);
  log('  --generate-secrets  Generate sample secrets for production');
  log('  --help, -h         Show this help message');
  log('');
  log('Environment variables:', colors.blue);
  log('  NODE_ENV           Set to "production" to validate production config');
  process.exit(0);
}

main().catch(error => {
  log(`💥 Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
