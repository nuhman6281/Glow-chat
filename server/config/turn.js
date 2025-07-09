const turnConfig = {
  // Development TURN servers (free services for testing)
  development: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: 'stun:stun1.l.google.com:19302'
    },
    {
      urls: 'stun:stun2.l.google.com:19302'
    },
    {
      urls: 'stun:stun3.l.google.com:19302'
    },
    {
      urls: 'stun:stun4.l.google.com:19302'
    }
  ],

  // Production TURN servers (requires paid service)
  production: [
    {
      urls: 'stun:stun.l.google.com:19302'
    },
    {
      urls: process.env.TURN_SERVER_URL || 'turn:your-turn-server.com:3478',
      username: process.env.TURN_USERNAME || 'username',
      credential: process.env.TURN_PASSWORD || 'password',
      credentialType: 'password'
    }
  ],

  // Fallback configuration
  fallback: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

/**
 * Get ICE servers configuration based on environment
 */
const getIceServers = () => {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'production' && process.env.TURN_SERVER_URL) {
    return turnConfig.production;
  }
  
  if (environment === 'development') {
    return turnConfig.development;
  }
  
  return turnConfig.fallback;
};

/**
 * Generate time-limited TURN credentials
 */
const generateTurnCredentials = (username, sharedSecret, ttl = 86400) => {
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha1', sharedSecret);
  hmac.update(turnUsername);
  const turnPassword = hmac.digest('base64');
  
  return {
    username: turnUsername,
    credential: turnPassword
  };
};

/**
 * Validate WebRTC peer connection configuration
 */
const validatePeerConnectionConfig = (config) => {
  if (!config || !config.iceServers || !Array.isArray(config.iceServers)) {
    throw new Error('Invalid peer connection configuration');
  }
  
  const hasStunServer = config.iceServers.some(server => 
    server.urls && (
      typeof server.urls === 'string' && server.urls.startsWith('stun:') ||
      Array.isArray(server.urls) && server.urls.some(url => url.startsWith('stun:'))
    )
  );
  
  if (!hasStunServer) {
    console.warn('No STUN server found in configuration. NAT traversal may fail.');
  }
  
  return true;
};

/**
 * Get complete peer connection configuration
 */
const getPeerConnectionConfig = () => {
  const config = {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };
  
  validatePeerConnectionConfig(config);
  return config;
};

/**
 * Setup TURN server for production deployment
 */
const setupTurnServer = () => {
  const instructions = `
TURN Server Setup Instructions:

1. For Production Deployment:
   - Use a service like Twilio, Agora, or self-hosted Coturn
   - Set environment variables:
     TURN_SERVER_URL=turn:your-server.com:3478
     TURN_USERNAME=your-username
     TURN_PASSWORD=your-password

2. Self-hosted Coturn Setup:
   # Install coturn
   sudo apt-get install coturn
   
   # Configure /etc/turnserver.conf
   listening-port=3478
   tls-listening-port=5349
   realm=your-domain.com
   server-name=your-domain.com
   fingerprint
   use-auth-secret
   static-auth-secret=your-secret-key
   stale-nonce=600
   cert=/path/to/cert.pem
   pkey=/path/to/private-key.pem
   
   # Start coturn service
   sudo systemctl enable coturn
   sudo systemctl start coturn

3. Docker Coturn Setup:
   docker run -d --name coturn \\
     -p 3478:3478 -p 3478:3478/udp \\
     -p 5349:5349 -p 5349:5349/udp \\
     -p 49152-65535:49152-65535/udp \\
     coturn/coturn:4.5.2 \\
     -n --log-file=stdout \\
     --realm=your-domain.com \\
     --server-name=your-domain.com \\
     --use-auth-secret \\
     --static-auth-secret=your-secret-key

4. Testing TURN Server:
   Use online tools like:
   - https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
   - https://test.webrtc.org/
  `;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n' + '='.repeat(60));
    console.log('WebRTC TURN Server Configuration');
    console.log('='.repeat(60));
    console.log(instructions);
    console.log('='.repeat(60) + '\n');
  }
};

export {
  getIceServers,
  generateTurnCredentials,
  validatePeerConnectionConfig,
  getPeerConnectionConfig,
  setupTurnServer,
  turnConfig
};