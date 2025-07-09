import express from 'express';
import { Request, Response } from 'express';
import { authenticate as protect } from '../middleware/auth';

const router = express.Router();

// Import TURN configuration
import { getPeerConnectionConfig, generateTurnCredentials } from '../config/turn.js';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Get ICE servers configuration for WebRTC
 * GET /api/webrtc/ice-servers
 */
router.get('/ice-servers', protect, async (req: AuthRequest, res: Response) => {
  try {
    const config = getPeerConnectionConfig();
    
    // Generate time-limited TURN credentials if needed
    if (process.env.TURN_SHARED_SECRET && req.user) {
      const turnCredentials = generateTurnCredentials(
        req.user._id.toString(),
        process.env.TURN_SHARED_SECRET,
        3600 // 1 hour TTL
      );
      
      // Update TURN servers with generated credentials
      config.iceServers = config.iceServers.map((server: any) => {
        if (server.urls && server.urls.startsWith('turn:')) {
          return {
            ...server,
            username: turnCredentials.username,
            credential: turnCredentials.credential
          };
        }
        return server;
      });
    }
    
    res.json({
      success: true,
      data: {
        iceServers: config.iceServers,
        iceTransportPolicy: config.iceTransportPolicy,
        bundlePolicy: config.bundlePolicy,
        rtcpMuxPolicy: config.rtcpMuxPolicy,
        iceCandidatePoolSize: config.iceCandidatePoolSize
      }
    });
  } catch (error) {
    console.error('Error getting ICE servers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ICE servers configuration'
    });
  }
});

/**
 * Test WebRTC connectivity
 * POST /api/webrtc/test
 */
router.post('/test', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { candidateType, protocol, address, port } = req.body;
    
    // Log connectivity test results
    console.log('WebRTC connectivity test:', {
      userId: req.user?._id,
      candidateType,
      protocol,
      address,
      port,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Connectivity test recorded'
    });
  } catch (error) {
    console.error('Error in WebRTC test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record connectivity test'
    });
  }
});

/**
 * Get WebRTC statistics
 * GET /api/webrtc/stats
 */
router.get('/stats', protect, async (req: AuthRequest, res: Response) => {
  try {
    // In a real implementation, you would fetch actual statistics
    // from a database or monitoring service
    const stats = {
      totalCalls: 0,
      activeCalls: 0,
      averageCallDuration: 0,
      connectionSuccess: 95.5,
      turnServerUsage: {
        stun: 60,
        turn: 40
      },
      networkTypes: {
        wifi: 70,
        cellular: 25,
        ethernet: 5
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting WebRTC stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get WebRTC statistics'
    });
  }
});

/**
 * Report WebRTC connection issues
 * POST /api/webrtc/report-issue
 */
router.post('/report-issue', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      issueType, 
      description, 
      callId, 
      errorMessage, 
      browserInfo, 
      networkInfo 
    } = req.body;
    
    // Log the issue for monitoring and debugging
    const issueReport = {
      userId: req.user?._id,
      issueType,
      description,
      callId,
      errorMessage,
      browserInfo,
      networkInfo,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    
    console.error('WebRTC Issue Report:', issueReport);
    
    // In production, you would save this to a database
    // and possibly trigger alerts for critical issues
    
    res.json({
      success: true,
      message: 'Issue report submitted successfully',
      reportId: Date.now().toString()
    });
  } catch (error) {
    console.error('Error submitting issue report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit issue report'
    });
  }
});

export default router;