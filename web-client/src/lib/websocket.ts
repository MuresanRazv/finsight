import { Client, StompSubscription, IMessage } from '@stomp/stompjs';
import SockJS from "sockjs-client";

export class WebSocketService {
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private pendingSubscriptions: Map<string, (message: any) => void> = new Map();

  constructor(token: string) {
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws-sentiment';
    
    this.client = new Client({
      brokerURL: socketUrl,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      webSocketFactory: () => {
        return new SockJS(socketUrl)
      }
    });

    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      this.processPendingSubscriptions();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };
  }

  public activate() {
    this.client.activate();
  }

  public deactivate() {
    this.client.deactivate();
    this.subscriptions.clear();
  }

  public subscribe(destination: string, callback: (message: any) => void) {
    if (!this.client.connected) {
      console.log(`Client not connected, queuing subscription for ${destination}`);
      this.pendingSubscriptions.set(destination, callback);
      return;
    }

    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        console.error('Error parsing message body', e);
        callback(message.body);
      }
    });

    this.subscriptions.set(destination, subscription);
  }

  public unsubscribe(destination: string) {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
    this.pendingSubscriptions.delete(destination);
  }

  private processPendingSubscriptions() {
    this.pendingSubscriptions.forEach((callback, destination) => {
      this.subscribe(destination, callback);
    });
    this.pendingSubscriptions.clear();
  }

  public isConnected(): boolean {
    return this.client.connected;
  }
}
