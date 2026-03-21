from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["settings:realtime"])

connections: list[WebSocket] = []


async def broadcast(message: dict) -> None:
    stale: list[WebSocket] = []

    for connection in list(connections):
        try:
            await connection.send_json(message)
        except Exception:
            stale.append(connection)

    for connection in stale:
        if connection in connections:
            connections.remove(connection)


async def broadcast_settings_update(
    user_id: str,
    section: str = "settings",
    actor_role: str | None = None,
) -> None:
    await broadcast(
        {
            "type": "SETTINGS_UPDATED",
            "user_id": user_id,
            "section": section,
            "actor_role": actor_role,
        }
    )


@router.websocket("/ws/settings")
async def settings_socket(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)

    await websocket.send_json(
        {
            "type": "SETTINGS_CONNECTED",
            "message": "Settings realtime channel connected",
        }
    )

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        if websocket in connections:
            connections.remove(websocket)
