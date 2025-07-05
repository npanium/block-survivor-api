# Block Survivor - Fluence VM Deployment Guide

> Real-time AI difficulty adjustment for Block Survivor using 0G Network LLM  
> **Deployed on Fluence Decentralized Compute Network**

## 🌐 Fluence VM Overview

This guide covers deploying Block Survivor's AI-powered game API on Fluence VM, combining:

- **Fluence Network**: Decentralized compute infrastructure
- **0G Network**: Decentralized LLM for real-time game difficulty adjustment
- **Block Survivor**: Dynamic survival game with AI-driven adaptability

## 📋 Prerequisites

### Fluence VM Requirements

- **VM Instance**: Fluence VM instance created and running
- **SSH Access**: Ability to SSH into your Fluence VM
- **Ports**: Ensure port 4000 is accessible (or configure your preferred port)

### 0G Network Requirements

- **0G Network Account**: Valid private key with sufficient balance
- **Network Access**: VM can reach 0G Network endpoints

### Technical Requirements

- **OS**: Ubuntu 20.04+ (typical Fluence VM setup)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: 10GB+ available space
- **CPU**: 2+ vCPUs recommended

## 🚀 Deployment Steps

### Step 1: Access Your Fluence VM

```bash
# SSH into your Fluence VM instance
ssh ubuntu@YOUR_FLUENCE_VM_IP
```

### Step 2: System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional tools
sudo apt install git htop curl -y

# Install PM2 for process management
sudo npm install -g pm2

# Verify installations
node --version && npm --version
```

### Step 3: Clone and Setup Project

```bash
# Clone the Block Survivor repository
git clone https://github.com/your-username/block-survivor-api.git
cd block-survivor-api

# Install dependencies
npm install

# Create environment configuration
nano .env
```

### Step 4: Environment Configuration

**In the `.env` file, configure:**

```bash
# Required - 0G Network Configuration
PRIVATE_KEY=your_0g_network_private_key

# Fluence VM Server Configuration
PORT=4000
NODE_ENV=production

# Fluence-specific settings
HOST=0.0.0.0
LOG_LEVEL=info

# Optional Game Configuration
DEFAULT_TERRAIN=rugged
DEFAULT_BOSS_SPEED=30
DEFAULT_BOSS_HEALTH=100
DEFAULT_BOSS_DAMAGE=10
```

**Save and secure the file:**

```bash
# Save: Ctrl+X, Y, Enter
chmod 600 .env
```

### Step 5: Build and Deploy

```bash
# Build the TypeScript project
npm run build

# Test the build
ls -la dist/

# Start with PM2 for production deployment
pm2 start dist/index.js --name "block-survivor-fluence"

# Configure PM2 for auto-restart
pm2 save
pm2 startup
# Follow the sudo command provided by PM2
```

### Step 6: Fluence VM Network Configuration

```bash
# Check if UFW firewall is active
sudo ufw status

# If active, allow the API port
sudo ufw allow 4000/tcp

# Verify the service is listening on all interfaces
sudo netstat -tlnp | grep 4000
# Should show: 0.0.0.0:4000 (not 127.0.0.1:4000)
```

### Step 7: Verify Deployment

```bash
# Test locally on the Fluence VM
curl http://localhost:4000/health
curl http://localhost:4000/api/game/health

# Check PM2 status
pm2 status
pm2 logs block-survivor-fluence
```

## 🧪 Testing on Fluence VM

### Quick LLM Integration Test

```bash
# Test the 0G Network LLM integration
node ./src/test-llm.js
```

### Game Simulation Tests

```bash
# Test different player skill levels
node ./src/simulate-game.js expert 3
node ./src/simulate-game.js beginner 3
node ./src/simulate-game.js comparison
```

### External Access Test

```bash
# From your local machine, test the Fluence VM deployment
curl http://YOUR_FLUENCE_VM_IP:4000/health
curl http://YOUR_FLUENCE_VM_IP:4000/api/game/health
```

## 🔧 Fluence VM Specific Considerations

### Resource Optimization

```bash
# Monitor VM resources
htop

# Check disk usage
df -h

# Monitor memory usage
free -h

# View PM2 monitoring dashboard
pm2 monit
```

### Network Configuration

```bash
# Check network connectivity to 0G Network
curl -I https://evmrpc-testnet.0g.ai

# Test DNS resolution
nslookup evmrpc-testnet.0g.ai

# Check outbound connectivity
curl -v https://httpbin.org/ip
```

### Logging on Fluence VM

```bash
# View application logs
pm2 logs block-survivor-fluence

# View system logs
sudo journalctl -f

# Check for any Fluence-specific logs
sudo dmesg | tail -20
```

## 📊 Monitoring and Maintenance

### Health Monitoring

```bash
# Create a health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Block Survivor API is healthy"
else
    echo "$(date): Block Survivor API is down (HTTP $RESPONSE)"
    # Restart if needed
    pm2 restart block-survivor-fluence
fi
EOF

chmod +x health-check.sh

# Set up a cron job for monitoring (every 5 minutes)
crontab -e
# Add: */5 * * * * /home/ubuntu/block-survivor-api/health-check.sh >> /home/ubuntu/health.log 2>&1
```

### Performance Monitoring

```bash
# Monitor 0G Network interactions
tail -f ~/.pm2/logs/block-survivor-fluence-out.log | grep "LLM"

# Track API response times
tail -f ~/.pm2/logs/block-survivor-fluence-out.log | grep "response time"

# Monitor active game sessions
curl http://localhost:4000/api/game/health | jq '.activeSessions'
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild
npm run build

# Restart the service
pm2 restart block-survivor-fluence

# Check status
pm2 status
```

### Backup Configuration

```bash
# Backup environment configuration
cp .env .env.backup

# Backup PM2 configuration
pm2 save
```

## 🌐 API Access from Unity

### Fluence VM Endpoint Configuration

**In your Unity game, configure the API endpoint:**

```csharp
public class GameAPIConfig
{
    // Replace with your actual Fluence VM IP and port
    public static readonly string API_BASE_URL = "http://YOUR_FLUENCE_VM_IP:4000/api";

    // Example: http://192.168.1.100:4000/api
    // Or if using domain: http://your-fluence-vm.example.com:4000/api
}
```

### Unity Integration Example

```csharp
// Start game session
var startRequest = new GameStartRequest { playerId = SystemInfo.deviceUniqueIdentifier };
var sessionResponse = await ApiClient.PostAsync($"{API_BASE_URL}/game/start", startRequest);

// Every 30 seconds - send metrics and get new config
var metrics = new PlayerMetrics
{
    apm = CalculateAPM(),
    dodgeRatio = CalculateDodgeRatio(),
    round = currentRound,
    distanceTraveled = GetPlayerDistance(),
    reactionTime = GetAverageReactionTime(),
    damageDealt = GetTotalDamageDealt()
};

var configResponse = await ApiClient.PostAsync(
    $"{API_BASE_URL}/game/{sessionId}/update",
    metrics
);

// Apply AI-generated configuration
ApplyGameConfig(configResponse.config);
```

## 🚨 Troubleshooting

### Common Fluence VM Issues

**Service won't start:**

```bash
# Check Node.js version
node --version  # Should be 18+

# Check for port conflicts
sudo lsof -i :4000

# Check PM2 logs
pm2 logs block-survivor-fluence --lines 50
```

**0G Network connectivity issues:**

```bash
# Test 0G Network endpoint
curl -v https://evmrpc-testnet.0g.ai

# Check private key format
node -e "console.log('Key length:', process.env.PRIVATE_KEY?.length)"

# Test broker initialization
node -e "require('dotenv').config(); console.log('Testing 0G connection...'); const { brokerService } = require('./dist/services/brokerService'); setTimeout(() => process.exit(0), 10000);"
```

**External access issues:**

```bash
# Check if service is listening on all interfaces
sudo netstat -tlnp | grep 4000

# Test firewall rules
sudo ufw status numbered

# Check Fluence VM network configuration
ip addr show
ip route show
```

### Performance Issues

**High memory usage:**

```bash
# Monitor memory
free -h
htop

# Restart if needed
pm2 restart block-survivor-fluence
```

**Slow LLM responses:**

```bash
# Check 0G Network status
curl -I https://evmrpc-testnet.0g.ai

# Monitor LLM call logs
tail -f ~/.pm2/logs/block-survivor-fluence-out.log | grep "LLM"
```

## 📱 Mobile/Web Access

### CORS Configuration

If accessing from web browsers or mobile apps, ensure CORS is properly configured:

```bash
# The API already includes CORS middleware, but you can verify:
curl -H "Origin: https://yourgame.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://YOUR_FLUENCE_VM_IP:4000/api/game/start
```

## 🔐 Security Best Practices

### Fluence VM Security

```bash
# Secure the private key file
chmod 600 .env

# Use strong SSH keys
ssh-keygen -t ed25519

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Monitor failed login attempts
sudo journalctl _SYSTEMD_UNIT=ssh.service | grep "Failed"
```

### API Security

```bash
# Consider adding rate limiting for production
# Monitor API usage
tail -f ~/.pm2/logs/block-survivor-fluence-out.log | grep "POST\|GET"
```

## 📞 Support and Resources

### Fluence Network Resources

- [Fluence Documentation](https://doc.fluence.dev/)
- [Fluence Community](https://t.me/fluence_project)

### 0G Network Resources

- [0G Network Documentation](https://0g.ai)
- [0G Network GitHub](https://github.com/0glabs)

### Block Survivor API

- **API Documentation**: `http://YOUR_FLUENCE_VM_IP:4000/docs`
- **Health Check**: `http://YOUR_FLUENCE_VM_IP:4000/health`
- **Game API Health**: `http://YOUR_FLUENCE_VM_IP:4000/api/game/health`

---

**🎮 Block Survivor running on Fluence VM with 0G Network AI - Built for EthGlobal Cannes 2025**
