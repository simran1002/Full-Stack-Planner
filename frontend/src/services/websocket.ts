type MessageHandler = (data: any) => void;

class WebSocketService {
  ws: WebSocket | null = null;
  messageHandlers = new Set<MessageHandler>();
  reconnectAttempts = 0;
  maxReconnectAttempts = 10; // Increased max attempts
  reconnectDelay = 1000; // Start with 1 second delay
  token: string;
  connected = false;
  pingTimer: NodeJS.Timeout | null = null;

  constructor(token: string) {
    this.token = token;
    console.log('WebSocketService constructor called with token');
    this.connect(token);
  }

  connect(token: string) {
    // Store the token for reconnection
    this.token = token;
    
    // Close existing connection if it exists
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {
        console.error('Error closing existing WebSocket:', e);
      }
      this.ws = null;
    }
    
    // Clear any existing ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    console.log('Connecting to WebSocket server with token...', token ? 'Token available' : 'No token');
    if (!token) {
      console.error('Cannot connect WebSocket: No token provided');
      return;
    }
    
    try {
      // Create new WebSocket connection with the correct URL
      // Use window.location to dynamically determine the host
      const host = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`;
      console.log('Connecting to WebSocket URL:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout after 5 seconds');
          this.connected = false;
          if (this.ws) {
            this.ws.close();
            this.handleReconnect(token);
          }
        }
      }, 5000); // 5 second timeout

      this.ws.onopen = () => {
        console.log('WebSocket connected successfully! ReadyState:', this.ws?.readyState);
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connected = true;
        
        // Send a ping immediately to verify the connection is working
        this.sendPing();
        
        // Set up a keep-alive ping every 10 seconds to prevent connection timeouts
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendPing();
          } else if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
            console.warn('WebSocket closed unexpectedly, attempting to reconnect');
            clearInterval(this.pingTimer as NodeJS.Timeout);
            this.pingTimer = null;
            this.connected = false;
            this.handleReconnect(this.token);
          }
        }, 10000);
      };

      this.ws.onmessage = (event) => {
        try {
          console.log('WebSocket message received:', event.data);
          // Handle both string and JSON messages
          let data;
          if (typeof event.data === 'string' && event.data.trim() === 'update') {
            console.log('Received update notification, will refresh tasks');
            data = 'update';
            // Send acknowledgment back to server
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ack', message: 'update_received' }));
            }
          } else if (typeof event.data === 'string' && event.data.trim() === 'pong') {
            console.log('Received pong from server');
            // No need to notify handlers for pong messages
            return;
          } else {
            try {
              data = JSON.parse(event.data);
              console.log('Parsed JSON data:', data);
            } catch {
              data = event.data;
              console.log('Using raw data:', data);
            }
          }
          this.messageHandlers.forEach(handler => handler(data));
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.handleReconnect(token);
    }

    if (this.ws) {
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect(token);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }

  handleReconnect(token: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      // Reset after a longer delay and try again
      setTimeout(() => {
        console.log('Resetting reconnection attempts and trying again');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connect(token);
      }, 60000); // Wait a minute before resetting
      return;
    }

    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
    setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Exponential backoff with 30s max
      console.log(`Reconnecting with delay: ${this.reconnectDelay}ms`);
      this.connect(token);
    }, this.reconnectDelay);
  }
  
  // Send a ping message to keep the connection alive
  sendPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending ping to keep connection alive');
      try {
        // Send a simple ping string as the backend expects
        this.ws.send('ping');
        console.log('Ping sent to server');
      } catch (error) {
        console.error('Error sending ping:', error);
        // If there's an error sending the ping, the connection might be broken
        this.connected = false;
        this.handleReconnect(this.token);
      }
    } else {
      console.warn('Cannot send ping: WebSocket not open. Current state:', this.ws?.readyState);
      if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
        this.connected = false;
        this.handleReconnect(this.token);
      }
    }
  }

  public subscribe(handler: MessageHandler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Add methods for more convenient event handling
  public onMessage(handler: (data: any) => void) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onOpen(handler: () => void) {
    if (this.ws) {
      const originalOnOpen = this.ws.onopen;
      this.ws.onopen = (event) => {
        if (originalOnOpen) {
          // @ts-ignore - TypeScript doesn't know this is a function or EventListener
          originalOnOpen(event);
        }
        handler();
      };
    }
  }

  public onError(handler: (error: Event) => void) {
    if (this.ws) {
      const originalOnError = this.ws.onerror;
      this.ws.onerror = (event) => {
        if (originalOnError) {
          // @ts-ignore - TypeScript doesn't know this is a function or EventListener
          originalOnError(event);
        }
        handler(event);
      };
    }
  }

  public onClose(handler: (event: CloseEvent) => void) {
    if (this.ws) {
      const originalOnClose = this.ws.onclose;
      this.ws.onclose = (event) => {
        if (originalOnClose) {
          // @ts-ignore - TypeScript doesn't know this is a function or EventListener
          originalOnClose(event);
        }
        handler(event);
      };
    }
  }

  public close() {
    console.log('Closing WebSocket connection and cleaning up resources');
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.ws = null;
    }
    this.connected = false;
    this.messageHandlers.clear();
  }
}

export default WebSocketService;
