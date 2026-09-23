import socketio
import logging
from typing import Dict, Any
from config import settings

logger = logging.getLogger("cat_sockets")

# Initialize Socket.IO AsyncServer
# We configure cors_allowed_origins='*' to support both local web and mobile clients
try:
    if settings.REDIS_URL and "redis" in settings.REDIS_URL:
        # We can attempt redis manager if redis is up, else fallback to standard in-memory
        mgr = socketio.AsyncRedisManager(settings.REDIS_URL)
        sio = socketio.AsyncServer(
            async_mode="asgi",
            cors_allowed_origins="*",
            client_manager=mgr
        )
    else:
        sio = socketio.AsyncServer(
            async_mode="asgi",
            cors_allowed_origins="*"
        )
except Exception as e:
    logger.warning(f"Could not connect to Redis for Socket.IO pub/sub, using in-memory: {e}")
    sio = socketio.AsyncServer(
        async_mode="asgi",
        cors_allowed_origins="*"
    )

# --- NAMESPACE: /location ---
# Handles real-time GPS position sync between Admin Fleet and Operator
@sio.on("connect", namespace="/location")
async def on_location_connect(sid, environ):
    logger.info(f"[Location] Client connected: {sid}")

@sio.on("disconnect", namespace="/location")
async def on_location_disconnect(sid):
    logger.info(f"[Location] Client disconnected: {sid}")

@sio.on("join_admin_fleet", namespace="/location")
async def on_join_admin_fleet(sid):
    await sio.enter_room(sid, "admin_fleet", namespace="/location")
    logger.info(f"[Location] {sid} joined room: admin_fleet")

@sio.on("join_operator_room", namespace="/location")
async def on_join_operator_room(sid, data: Dict[str, Any]):
    operator_id = data.get("operator_id") if isinstance(data, dict) else data
    if operator_id:
        room_name = f"operator_{operator_id}"
        await sio.enter_room(sid, room_name, namespace="/location")
        logger.info(f"[Location] {sid} joined room: {room_name}")

# --- NAMESPACE: /telemetry ---
# Handles real-time telemetry updates (fuel, temp, engine hours, seatbelt)
@sio.on("connect", namespace="/telemetry")
async def on_telemetry_connect(sid, environ):
    logger.info(f"[Telemetry] Client connected: {sid}")

@sio.on("disconnect", namespace="/telemetry")
async def on_telemetry_disconnect(sid):
    logger.info(f"[Telemetry] Client disconnected: {sid}")

# --- NAMESPACE: /alerts ---
# Handles instant safety alerts and incident push
@sio.on("connect", namespace="/alerts")
async def on_alerts_connect(sid, environ):
    logger.info(f"[Alerts] Client connected: {sid}")

@sio.on("disconnect", namespace="/alerts")
async def on_alerts_disconnect(sid):
    logger.info(f"[Alerts] Client disconnected: {sid}")


# Helper broadcast functions called by simulator.py and rules_engine.py

async def broadcast_position(payload: Dict[str, Any], operator_id: int = None):
    """
    Broadcasts machine position to both admin_fleet and operator_{operator_id} rooms.
    Payload: { machine_id, task_id, zone_id, lat, lng, heading, speed_kmh, inside_geofence, timestamp }
    """
    try:
        # Broadcast to all admin clients
        await sio.emit("position_update", payload, room="admin_fleet", namespace="/location")
        # Broadcast to specific assigned operator client if available
        if operator_id:
            await sio.emit("position_update", payload, room=f"operator_{operator_id}", namespace="/location")
    except Exception as e:
        logger.error(f"Error broadcasting position: {e}")

async def broadcast_telemetry(payload: Dict[str, Any]):
    """
    Broadcasts machine telemetry to all connected telemetry listeners.
    Payload: { machine_id, fuel_level, hydraulic_temp, engine_hours, idle_seconds, seatbelt_status, timestamp }
    """
    try:
        await sio.emit("telemetry_update", payload, namespace="/telemetry")
    except Exception as e:
        logger.error(f"Error broadcasting telemetry: {e}")

async def broadcast_new_alert(payload: Dict[str, Any]):
    """
    Broadcasts new alert to alerts namespace.
    Payload: { id, alert_type, priority_rank, machine_id, operator_id, message, severity, created_at }
    """
    try:
        await sio.emit("new_alert", payload, namespace="/alerts")
    except Exception as e:
        logger.error(f"Error broadcasting new alert: {e}")

async def broadcast_alert_resolved(alert_id: int):
    try:
        await sio.emit("alert_resolved", {"id": alert_id}, namespace="/alerts")
    except Exception as e:
        logger.error(f"Error broadcasting alert resolved: {e}")
