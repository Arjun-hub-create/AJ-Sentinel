import json
import logging
from typing import Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        # All currently connected WebSocket clients
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        """Accept a new WebSocket connection."""
        await ws.accept()
        self.active.add(ws)
        logger.info(f"WS connected. Total: {len(self.active)}")

    def disconnect(self, ws: WebSocket):
        """Remove a WebSocket connection (called on close/error)."""
        self.active.discard(ws)
        logger.info(f"WS disconnected. Total: {len(self.active)}")

    async def broadcast(self, data: dict):
        """
        Send a JSON message to ALL connected clients.
        Automatically removes dead connections.
        """
        if not self.active:
            return

        message = json.dumps(data, default=str)
        dead = set()

        for ws in self.active.copy():
            try:
                await ws.send_text(message)
            except Exception:
                dead.add(ws)

        # Clean up dead connections
        for ws in dead:
            self.active.discard(ws)

    async def send_to(self, ws: WebSocket, data: dict):
        """Send a message to a single specific client."""
        try:
            await ws.send_text(json.dumps(data, default=str))
        except Exception:
            self.disconnect(ws)

    @property
    def connection_count(self) -> int:
        return len(self.active)


# Single global instance used everywhere
ws_manager = WebSocketManager()
