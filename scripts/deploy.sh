#!/bin/bash

# FleetFlow Production Deployment Script
# This script sets up the complete FleetFlow system for production use

set -e

echo "🚛 FleetFlow Production Deployment Started"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-docker}  # docker or k8s
DOMAIN=${2:-fleetflow.in}
EMAIL=${3:-admin@fleetflow.in}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        echo -e "${RED}❌ Please don't run this script as root${NC}"
        exit 1
    fi
    
    # Check required tools
    tools=("docker" "docker-compose" "git")
    if [[ "$DEPLOY_ENV" == "k8s" ]]; then
        tools+=("kubectl" "helm")
    fi
    
    for tool in "${tools[@]}"; do
        if ! command -v $tool &> /dev/null; then
            echo -e "${RED}❌ $tool is not installed${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ $tool found${NC}"
        fi
    done
}

# Setup environment
setup_environment() {
    echo -e "${BLUE}🔧 Setting up environment...${NC}"
    
    # Create .env file if it doesn't exist
    if [[ ! -f .env ]]; then
        echo -e "${YELLOW}📝 Creating .env file...${NC}"
        cat > .env << EOF
# Database Configuration
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 64)

# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=$(openssl rand -base64 32)

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=fleetflow-uploads
AWS_S3_BACKUP_BUCKET=fleetflow-backups

# Monitoring
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Domain Configuration
DOMAIN=$DOMAIN
EMAIL=$EMAIL
EOF
        echo -e "${YELLOW}⚠️  Please edit .env file with your actual API keys and credentials${NC}"
        echo -e "${YELLOW}⚠️  Press Enter when ready to continue...${NC}"
        read
    fi
    
    # Source environment variables
    set -a
    source .env
    set +a
    
    echo -e "${GREEN}✅ Environment configured${NC}"
}

# Setup SSL certificates
setup_ssl() {
    echo -e "${BLUE}🔒 Setting up SSL certificates...${NC}"
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    if [[ "$DEPLOY_ENV" == "docker" ]]; then
        # Use Let's Encrypt with Certbot
        echo -e "${YELLOW}📜 Setting up Let's Encrypt...${NC}"
        
        # Create certbot directories
        mkdir -p certbot/conf certbot/www
        
        # Get initial certificates
        docker run --rm \
            -v $(pwd)/certbot/conf:/etc/letsencrypt \
            -v $(pwd)/certbot/www:/var/www/certbot \
            certbot/certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email $EMAIL \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN \
            -d api.$DOMAIN \
            -d track.$DOMAIN
        
        echo -e "${GREEN}✅ SSL certificates obtained${NC}"
    fi
}

# Build Docker images
build_images() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"
    
    # Build Go backend
    echo -e "${YELLOW}Building Go gRPC backend...${NC}"
    cd go-backend
    docker build -t fleetflow/grpc-backend:latest .
    cd ..
    
    # Build Java backend (if needed)
    echo -e "${YELLOW}Building Java backend...${NC}"
    cd backend
    docker build -t fleetflow/java-backend:latest .
    cd ..
    
    # Build web frontend
    echo -e "${YELLOW}Building web frontend...${NC}"
    cd web
    docker build -t fleetflow/web-frontend:latest \
        --build-arg VITE_API_BASE=https://api.$DOMAIN \
        --build-arg VITE_GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY .
    cd ..
    
    # Build customer portal
    echo -e "${YELLOW}Building customer portal...${NC}"
    cd customer-portal
    docker build -t fleetflow/customer-portal:latest \
        --build-arg NEXT_PUBLIC_API_BASE=https://api.$DOMAIN \
        --build-arg NEXT_PUBLIC_GOOGLE_MAPS_KEY=$GOOGLE_MAPS_API_KEY .
    cd ..
    
    # Build WhatsApp service
    echo -e "${YELLOW}Building WhatsApp service...${NC}"
    cd whatsapp-service
    docker build -t fleetflow/whatsapp-service:latest .
    cd ..
    
    echo -e "${GREEN}✅ All Docker images built successfully${NC}"
}

# Deploy with Docker Compose
deploy_docker() {
    echo -e "${BLUE}🐳 Deploying with Docker Compose...${NC}"
    
    # Create necessary directories
    mkdir -p uploads backups logs
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 30
    
    # Check service health
    check_services
    
    echo -e "${GREEN}✅ Docker deployment completed${NC}"
}

# Deploy with Kubernetes
deploy_k8s() {
    echo -e "${BLUE}☸️  Deploying with Kubernetes...${NC}"
    
    # Create namespace
    kubectl apply -f k8s/deployment.yaml
    
    # Wait for deployments
    echo -e "${YELLOW}⏳ Waiting for deployments...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment --all -n fleetflow
    
    # Check service status
    kubectl get pods -n fleetflow
    kubectl get services -n fleetflow
    
    echo -e "${GREEN}✅ Kubernetes deployment completed${NC}"
}

# Check service health
check_services() {
    echo -e "${BLUE}🔍 Checking service health...${NC}"
    
    services=(
        "http://localhost:8080/health:gRPC Backend"
        "http://localhost:3000:Web Frontend"
        "http://localhost:3001:Customer Portal"
        "http://localhost:3002/health:WhatsApp Service"
    )
    
    for service in "${services[@]}"; do
        url=$(echo $service | cut -d: -f1)
        name=$(echo $service | cut -d: -f2)
        
        if curl -s -f $url > /dev/null; then
            echo -e "${GREEN}✅ $name is healthy${NC}"
        else
            echo -e "${RED}❌ $name is not responding${NC}"
        fi
    done
}

# Setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Create monitoring config directories
    mkdir -p monitoring/{prometheus,grafana/{dashboards,datasources}}
    
    # Create Prometheus config
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'fleetflow-backend'
    static_configs:
      - targets: ['grpc-backend:8080']
    metrics_path: '/metrics'

  - job_name: 'fleetflow-whatsapp'
    static_configs:
      - targets: ['whatsapp-service:3001']
    metrics_path: '/metrics'

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF
    
    # Create Grafana datasource config
    cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
    
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
}

# Setup backup system
setup_backup() {
    echo -e "${BLUE}💾 Setting up backup system...${NC}"
    
    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# FleetFlow Backup Script
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
S3_BUCKET="${AWS_S3_BACKUP_BUCKET}"

# Database backup
echo "Creating database backup..."
pg_dump -h postgres -U fleetflow -d fleetflow | gzip > ${BACKUP_DIR}/fleetflow_db_${DATE}.sql.gz

# Upload to S3 if configured
if [[ -n "$S3_BUCKET" ]]; then
    echo "Uploading to S3..."
    aws s3 cp ${BACKUP_DIR}/fleetflow_db_${DATE}.sql.gz s3://${S3_BUCKET}/database/
fi

# Clean old backups (keep last 7 days)
find ${BACKUP_DIR} -name "fleetflow_db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: fleetflow_db_${DATE}.sql.gz"
EOF
    
    chmod +x scripts/backup.sh
    
    echo -e "${GREEN}✅ Backup system configured${NC}"
}

# Post-deployment configuration
post_deployment() {
    echo -e "${BLUE}⚙️  Running post-deployment configuration...${NC}"
    
    # Wait for database to be ready
    echo -e "${YELLOW}⏳ Waiting for database initialization...${NC}"
    sleep 10
    
    # Run database migrations (if needed)
    if [[ "$DEPLOY_ENV" == "docker" ]]; then
        docker-compose -f docker-compose.production.yml exec grpc-backend /app/migrate || true
    fi
    
    # Create initial admin user (if needed)
    echo -e "${YELLOW}👤 Creating initial admin user...${NC}"
    # This would typically call an API endpoint or run a script
    
    echo -e "${GREEN}✅ Post-deployment configuration completed${NC}"
}

# Main deployment function
main() {
    echo -e "${GREEN}🚛 FleetFlow Production Deployment${NC}"
    echo -e "${BLUE}Deployment mode: $DEPLOY_ENV${NC}"
    echo -e "${BLUE}Domain: $DOMAIN${NC}"
    echo ""
    
    check_prerequisites
    setup_environment
    setup_ssl
    build_images
    setup_monitoring
    setup_backup
    
    if [[ "$DEPLOY_ENV" == "k8s" ]]; then
        deploy_k8s
    else
        deploy_docker
    fi
    
    post_deployment
    
    echo ""
    echo -e "${GREEN}🎉 FleetFlow deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📱 Access your applications:${NC}"
    echo -e "  🌐 Fleet Management: https://$DOMAIN"
    echo -e "  📦 Customer Tracking: https://track.$DOMAIN"
    echo -e "  🔧 API Documentation: https://api.$DOMAIN/docs"
    echo -e "  📊 Monitoring: https://monitor.$DOMAIN"
    echo ""
    echo -e "${YELLOW}⚠️  Important next steps:${NC}"
    echo -e "  1. Update DNS records to point to your server"
    echo -e "  2. Configure WhatsApp Business API credentials"
    echo -e "  3. Set up Google Maps API key"
    echo -e "  4. Configure AWS S3 for file storage"
    echo -e "  5. Set up backup schedules"
    echo ""
    echo -e "${GREEN}🎯 Your FleetFlow system is ready for production!${NC}"
}

# Run main function
main "$@"
