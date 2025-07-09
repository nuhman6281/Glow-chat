# Production Deployment Guide

This guide provides instructions for deploying the Glow Chat application in production using Docker Compose and Docker Swarm.

## Prerequisites

- Docker Engine 20.10+ and Docker Compose v2.0+
- Docker Swarm initialized (for swarm deployment)
- Production server with sufficient resources
- Domain names configured with DNS pointing to your server
- SSL certificates (automatically handled by Traefik with Let's Encrypt)

## Environment Setup

1. **Create volume directories** (adjust paths as needed):
   ```bash
   sudo mkdir -p /var/lib/glow-chat/{mongo/{data,config,backups},redis/{data,backups},backup/scripts,traefik/certs,prometheus/data}
   sudo chown -R 1001:1001 /var/lib/glow-chat/mongo
   sudo chown -R 999:999 /var/lib/glow-chat/redis
   sudo chown -R 65534:65534 /var/lib/glow-chat/prometheus
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.prod .env.production
   # Edit .env.production with your actual values
   nano .env.production
   ```

3. **Build production images**:
   ```bash
   # Build backend image
   docker build -f Dockerfile.backend -t glow-lab/backend:latest --target production .
   
   # Build frontend image
   docker build -f Dockerfile.frontend -t glow-lab/frontend:latest --target production ./frontend
   ```

## Deployment Options

### Option 1: Docker Compose (Recommended for single server)

1. **Deploy with production profile**:
   ```bash
   # Deploy all services
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d
   
   # Or deploy with monitoring
   docker compose -f docker-compose.prod.yml --env-file .env.production --profile monitoring up -d
   ```

2. **Scale services** (optional):
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --scale backend=3 --scale frontend=2
   ```

3. **View logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

4. **Stop services**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

### Option 2: Docker Swarm (Recommended for multi-server)

1. **Initialize Docker Swarm** (if not already done):
   ```bash
   docker swarm init
   ```

2. **Deploy to swarm**:
   ```bash
   # Deploy stack
   docker stack deploy -c docker-compose.prod.yml --with-registry-auth glow-chat
   
   # Or with environment file
   env $(cat .env.production | xargs) docker stack deploy -c docker-compose.prod.yml --with-registry-auth glow-chat
   ```

3. **Scale services**:
   ```bash
   docker service scale glow-chat_backend=3
   docker service scale glow-chat_frontend=2
   ```

4. **View services**:
   ```bash
   docker stack services glow-chat
   docker service logs glow-chat_backend
   ```

5. **Remove stack**:
   ```bash
   docker stack rm glow-chat
   ```

## Monitoring and Maintenance

### Health Checks
All services include health checks that can be monitored:
```bash
docker compose -f docker-compose.prod.yml ps
```

### Logs
View logs for specific services:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f mongo
docker compose -f docker-compose.prod.yml logs -f redis
```

### Backups
The backup service automatically creates daily backups:
- MongoDB: `/var/lib/glow-chat/mongo/backups/YYYYMMDD_HHMMSS/`
- Redis: `/var/lib/glow-chat/redis/backups/dump_YYYYMMDD_HHMMSS.rdb`

Manual backup:
```bash
# MongoDB backup
docker exec glow-chat-mongo mongodump --out /backups/manual_$(date +%Y%m%d_%H%M%S)

# Redis backup
docker exec glow-chat-redis redis-cli --rdb /backups/manual_$(date +%Y%m%d_%H%M%S).rdb
```

### SSL Certificates
Traefik automatically obtains and renews Let's Encrypt certificates. Monitor certificate status:
```bash
docker exec glow-chat-reverse-proxy cat /letsencrypt/acme.json
```

## Updating the Application

### Rolling Updates (Docker Compose)
```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Update services with zero downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --build backend
docker compose -f docker-compose.prod.yml up -d --no-deps --build frontend
```

### Rolling Updates (Docker Swarm)
```bash
# Update backend service
docker service update --image glow-lab/backend:v2.0 glow-chat_backend

# Update frontend service
docker service update --image glow-lab/frontend:v2.0 glow-chat_frontend
```

## Security Considerations

1. **Firewall Configuration**:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Secret Management**:
   - Use Docker secrets for sensitive data in Swarm mode
   - Never commit real secrets to version control
   - Rotate secrets regularly

3. **Network Security**:
   - All services run on an isolated Docker network
   - Database and Redis are not exposed to the internet
   - Traefik handles SSL termination

## Troubleshooting

### Common Issues

1. **Services not starting**:
   ```bash
   docker compose -f docker-compose.prod.yml logs [service_name]
   docker compose -f docker-compose.prod.yml ps
   ```

2. **Database connection issues**:
   ```bash
   # Check MongoDB logs
   docker compose -f docker-compose.prod.yml logs mongo
   
   # Test connection
   docker exec -it glow-chat-mongo mongosh
   ```

3. **Redis connection issues**:
   ```bash
   # Check Redis logs
   docker compose -f docker-compose.prod.yml logs redis
   
   # Test connection
   docker exec -it glow-chat-redis redis-cli ping
   ```

4. **SSL certificate issues**:
   ```bash
   # Check Traefik logs
   docker compose -f docker-compose.prod.yml logs reverse-proxy
   
   # Verify certificate
   openssl s_client -connect your-domain.com:443 -servername your-domain.com
   ```

### Performance Monitoring

Access monitoring dashboards:
- Traefik Dashboard: `https://your-domain.com:8080`
- Prometheus (if enabled): `https://monitoring.your-domain.com`

## Resource Requirements

### Minimum Requirements
- **CPU**: 2 vCPUs
- **Memory**: 4GB RAM
- **Storage**: 50GB SSD
- **Network**: 100 Mbps

### Recommended Requirements
- **CPU**: 4 vCPUs
- **Memory**: 8GB RAM
- **Storage**: 100GB SSD
- **Network**: 1 Gbps

## Backup and Recovery

### Database Backup
```bash
# Create backup
docker exec glow-chat-mongo mongodump --out /backups/$(date +%Y%m%d_%H%M%S)

# Restore from backup
docker exec glow-chat-mongo mongorestore /backups/BACKUP_FOLDER/
```

### Redis Backup
```bash
# Create RDB backup
docker exec glow-chat-redis redis-cli --rdb /backups/redis_$(date +%Y%m%d_%H%M%S).rdb

# Restore Redis (restart with backup file)
docker cp backup.rdb glow-chat-redis:/data/dump.rdb
docker compose -f docker-compose.prod.yml restart redis
```

## Scaling Guidelines

### Horizontal Scaling
```bash
# Scale backend (CPU intensive)
docker service scale glow-chat_backend=5

# Scale frontend (memory intensive)
docker service scale glow-chat_frontend=3
```

### Vertical Scaling
Modify resource limits in `docker-compose.prod.yml`:
```yaml
resources:
  limits:
    cpus: '2.0'
    memory: 2G
  reservations:
    cpus: '1.0'
    memory: 1G
```

## Support

For issues related to deployment:
1. Check the logs for error messages
2. Verify environment variables are correctly set
3. Ensure all required volumes are mounted
4. Check network connectivity between services
5. Review the troubleshooting section above

For application-specific issues, refer to the main README.md file.
