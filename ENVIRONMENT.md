# Environment Configuration Guide

This document describes the environment configuration setup for the Glow Chat application.

## Overview

The application uses a centralized configuration system that loads environment variables from different files based on the `NODE_ENV` setting:

- **Development**: `.env` (default)
- **Production**: `.env.prod`

## Files Structure

```
.env                    # Development environment variables
.env.prod              # Production environment variables (secrets)
.env.example           # Template for new environments
server/config/config.ts # Centralized configuration loader
```

## Configuration Categories

### 🔧 Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `BACKEND_PORT` - Backend service port

### 🗄️ Database Configuration
- `MONGO_URI` / `MONGODB_URI` - MongoDB connection string
- `MONGO_DB_NAME` - Database name
- `MONGO_ROOT_USERNAME` - MongoDB root username
- `MONGO_ROOT_PASSWORD` - MongoDB root password
- `MONGO_PORT` - MongoDB port
- `DB_POOL_SIZE` - Connection pool size
- `DB_TIMEOUT` - Database timeout
- `DB_RETRY_ATTEMPTS` - Retry attempts on connection failure

### 🔴 Redis Configuration
- `REDIS_URL` - Redis connection string
- `REDIS_PORT` - Redis port

### 🔐 JWT Configuration
- `JWT_SECRET` - JWT signing secret (REQUIRED, min 32 chars)
- `JWT_EXPIRES_IN` - JWT expiration time

### 🌐 Client Configuration
- `CLIENT_URL` - Frontend application URL
- `FRONTEND_PORT` - Frontend port
- `CORS_ORIGIN` - CORS allowed origins
- `API_BASE_URL` - API base URL
- `REACT_APP_API_URL` - React app API URL

### 📁 File Upload Configuration
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `MAX_FILE_SIZE` - Maximum file upload size

### 📧 Email Configuration
- `SMTP_HOST` - SMTP server host
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `EMAIL_FROM` - Default sender email

### 🎥 WebRTC Configuration
- `TURN_SERVER_URL` - TURN server URL
- `TURN_USERNAME` - TURN server username
- `TURN_CREDENTIAL` - TURN server credentials

### 📊 Logging Configuration
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `LOG_FILE` - Log file path

### 🔒 Security Configuration
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `BCRYPT_SALT_ROUNDS` - Password hashing rounds
- `SESSION_SECRET` - Session signing secret (REQUIRED, min 32 chars)
- `SESSION_TIMEOUT` - Session timeout duration

### 🛠️ Development Tools
- `DEBUG` - Enable debug mode
- `ENABLE_SWAGGER` - Enable Swagger documentation

### 🚀 Performance Configuration (Production)
- `CLUSTER_MODE` - Enable cluster mode
- `MAX_WORKERS` - Maximum worker processes
- `MEMORY_LIMIT` - Memory limit per process
- `HEALTH_CHECK_INTERVAL` - Health check interval
- `METRICS_ENABLED` - Enable metrics collection
- `METRICS_PORT` - Metrics server port

### 🔐 SSL/TLS Configuration (Production)
- `SSL_KEY_PATH` - SSL private key path
- `SSL_CERT_PATH` - SSL certificate path
- `SSL_CA_PATH` - SSL CA bundle path

## Setup Instructions

### 1. Development Setup

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your development values
nano .env
```

**Required variables for development:**
- `JWT_SECRET` - Must be at least 32 characters
- `SESSION_SECRET` - Must be at least 32 characters

### 2. Production Setup

```bash
# Create production environment file
cp .env.example .env.prod

# Edit with production values
nano .env.prod
```

**Critical production changes:**
- Set strong `JWT_SECRET` (min 32 chars, random)
- Set strong `SESSION_SECRET` (min 32 chars, random)
- Update `MONGO_ROOT_PASSWORD` with secure password
- Set correct domain URLs for `CLIENT_URL`, `CORS_ORIGIN`
- Configure production email settings
- Set `NODE_ENV=production`
- Disable debug tools (`DEBUG=false`, `ENABLE_SWAGGER=false`)

### 3. Docker Compose Usage

The `docker-compose.yml` file automatically reads from your environment files:

```bash
# Development (uses .env)
docker-compose up

# Production (set NODE_ENV first)
NODE_ENV=production docker-compose up
```

## Configuration Validation

The application validates configuration on startup:

- Checks for required environment variables
- Validates minimum length for secrets
- Warns about development secrets in production
- Provides detailed error messages for missing config

## Security Best Practices

### Development
- Use placeholder secrets (already set in `.env`)
- Keep sensitive services (MongoDB, Redis) local
- Enable debug tools for easier development

### Production
- **Never** commit `.env.prod` to version control
- Use strong, randomly generated secrets
- Disable debug tools and verbose logging
- Use environment-specific database names
- Implement proper SSL/TLS certificates
- Use secure email providers

## Environment Variables Reference

| Variable | Development Default | Production Required | Description |
|----------|-------------------|-------------------|-------------|
| `JWT_SECRET` | dev-secret-* | ✅ | JWT signing secret |
| `SESSION_SECRET` | dev-session-* | ✅ | Session secret |
| `MONGO_ROOT_PASSWORD` | password123 | ✅ | MongoDB password |
| `NODE_ENV` | development | ✅ | Environment mode |
| `CLIENT_URL` | localhost:8080 | ✅ | Frontend URL |
| `CLOUDINARY_*` | placeholder | ⚠️ | File upload (optional) |
| `SMTP_*` | placeholder | ⚠️ | Email (optional) |

## Troubleshooting

### Configuration Validation Errors
```
Error: Configuration validation failed:
JWT_SECRET is required
```
**Solution**: Set the missing environment variable in your `.env` file.

### Database Connection Issues
```
Error: MongooseError: connect ECONNREFUSED
```
**Solution**: Check `MONGO_URI` and ensure MongoDB is running.

### CORS Errors
```
Error: Access to fetch at 'http://api.domain.com' from origin 'http://client.domain.com' has been blocked by CORS
```
**Solution**: Update `CORS_ORIGIN` to match your frontend URL.

## Docker Environment File Loading

The configuration system automatically loads the correct environment file:
- Development: `.env`
- Production: `.env.prod`

You can override this by setting `NODE_ENV` before starting the application:

```bash
NODE_ENV=production npm start
```

## Adding New Configuration

1. Add the environment variable to both `.env` and `.env.prod`
2. Update `.env.example` with the new variable
3. Add the variable to `server/config/config.ts`:
   - Add to the `AppConfig` interface
   - Add to the configuration object
   - Add validation if required
4. Update `docker-compose.yml` if needed for containers
5. Document the new variable in this README

## Support

For configuration issues:
1. Check this documentation
2. Verify all required variables are set
3. Check the application logs for validation errors
4. Ensure environment file syntax is correct (no spaces around `=`)
