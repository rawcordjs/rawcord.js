// gateway.ts
import WebSocket from "ws";
import {
  GatewayOpcodes,
  GatewayDispatchEvents,
  type GatewayHelloData,
  type GatewayIdentifyData,
  type GatewayDispatchPayload,
  type GatewayResumeData,
} from "discord-api-types/v10";
import { GatewayIntentBits } from "../constants/Gateway.js";

const GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";

export class Gateway {
  private ws!: WebSocket;
  private heartbeatInterval = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private lastHeartbeatAck = true;

  private seq: number | null = null;
  private sessionId: string | null = null;

  constructor(
    private readonly token: string,
    private readonly intents: GatewayIntentBits,
  ) {}

  connect() {
    this.ws = new WebSocket(GATEWAY_URL);

    this.ws.on("open", () => {
      console.log("[WS] Connected");
    });

    this.ws.on("message", (data) => {
      const payload = JSON.parse(data.toString());
      this.handlePayload(payload);
    });

    this.ws.on("close", (code, reason) => {
      console.log("[WS] Closed:", code, reason.toString());
      this.cleanup();
    });

    this.ws.on("error", (err) => {
      console.error("[WS] Error:", err);
    });
  }

  private handlePayload(payload: any) {
    const { op, d, s } = payload;

    if (s !== null) this.seq = s;

    switch (op) {
      case GatewayOpcodes.Hello:
        this.onHello(d as GatewayHelloData);
        break;

      case GatewayOpcodes.HeartbeatAck:
        this.lastHeartbeatAck = true;
        break;

      case GatewayOpcodes.Dispatch:
        this.onDispatch(payload as GatewayDispatchPayload);
        break;

      case GatewayOpcodes.Reconnect:
        this.reconnect(true);
        break;

      case GatewayOpcodes.InvalidSession:
        this.onInvalidSession(d as boolean);
        break;
    }
  }

  /* ------------------- EVENT HANDLERS ------------------- */

  private onHello(data: GatewayHelloData) {
    this.heartbeatInterval = data.heartbeat_interval;
    this.startHeartbeat();

    if (this.sessionId) {
      this.resume();
    } else {
      this.identify();
    }
  }

  private onDispatch(payload: GatewayDispatchPayload) {
    if (payload.t === GatewayDispatchEvents.Ready) {
      this.sessionId = payload.d.session_id;
      console.log("[READY] Session:", this.sessionId);
    }

    console.log("[EVENT]", payload.t);
  }

  private onInvalidSession(resumable: boolean) {
    this.cleanup();

    setTimeout(() => {
      if (resumable && this.sessionId) {
        this.resume();
      } else {
        this.sessionId = null;
        this.seq = null;
        this.identify();
      }
    }, 1000);
  }

  /* ------------------- HEARTBEAT ------------------- */

  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (!this.lastHeartbeatAck) {
        console.warn("[WS] Missed HEARTBEAT_ACK, reconnecting");
        this.reconnect(true);
        return;
      }

      this.lastHeartbeatAck = false;

      this.send({
        op: GatewayOpcodes.Heartbeat,
        d: this.seq,
      });
    }, this.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /* ------------------- IDENTIFY / RESUME ------------------- */

  private identify() {
    const payload: GatewayIdentifyData = {
      token: this.token,
      intents: this.intents,
      properties: {
        os: "linux",
        browser: "rawcord",
        device: "rawcord",
      },
    };

    this.send({
      op: GatewayOpcodes.Identify,
      d: payload,
    });
  }

  private resume() {
    if (!this.sessionId || this.seq === null) return;

    const payload: GatewayResumeData = {
      token: this.token,
      session_id: this.sessionId,
      seq: this.seq,
    };

    this.send({
      op: GatewayOpcodes.Resume,
      d: payload,
    });
  }

  /* ------------------- CONNECTION CONTROL ------------------- */

  private reconnect(_resume: boolean) {
    console.log("[WS] Reconnecting...");
    this.cleanup();
    this.connect();
  }

  private cleanup() {
    this.stopHeartbeat();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  private send(payload: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

export default Gateway;