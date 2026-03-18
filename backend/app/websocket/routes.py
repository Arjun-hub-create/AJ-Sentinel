from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.websocket.manager import ws_manager
from app.core.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str = Query(default=None)):
    """
    Main WebSocket endpoint.

    Frontend connects with:
      const socket = new WebSocket("ws://localhost:8000/ws?token=<jwt>")

    Messages pushed to client:
      { type: "metric",   payload: { service_id, status, latency_ms, ... } }
      { type: "incident", payload: { service, status, severity } }
      { type: "log",      payload: { service, level, message, timestamp } }
      { type: "ping",     payload: { connections: N } }
    """
    await ws_manager.connect(ws)

    # Send welcome message with current connection count
    await ws_manager.send_to(ws, {
        "type": "connected",
        "payload": {
            "message":     "SENTINEL WebSocket connected",
            "connections": ws_manager.connection_count,
        }
    })

    try:
        while True:
            # Keep connection alive — handle ping/pong from client
            data = await ws.receive_text()
            if data == "ping":
                await ws_manager.send_to(ws, {"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
    except Exception as e:
        logger.error(f"WS error: {e}")
        ws_manager.disconnect(ws)
