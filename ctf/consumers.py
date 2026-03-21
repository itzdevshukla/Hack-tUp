import json
import asyncio
import os
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer

active_ctf_consumers = set()
background_task = None

def get_event_file_path():
    return os.path.join(settings.BASE_DIR, 'ws_events.log')

async def poll_ipc_events():
    event_file = get_event_file_path()
    
    # Ensure file exists
    if not os.path.exists(event_file):
        with open(event_file, 'a') as f:
            pass
            
    last_size = os.path.getsize(event_file)

    while True:
        try:
            if not active_ctf_consumers:
                await asyncio.sleep(1)
                continue
                
            current_size = os.path.getsize(event_file)
            
            # File was truncated or deleted
            if current_size < last_size:
                last_size = 0
                
            if current_size > last_size:
                with open(event_file, 'r') as f:
                    f.seek(last_size)
                    new_data = f.read()
                
                last_size = current_size
                
                # Broadcast events
                for line in new_data.strip().split('\n'):
                    if line.strip():
                        try:
                            event = json.loads(line)
                            
                            disconnected = set()
                            for consumer in list(active_ctf_consumers):
                                try:
                                    await consumer.send(text_data=json.dumps(event))
                                except Exception:
                                    disconnected.add(consumer)
                                    
                            for d in disconnected:
                                active_ctf_consumers.discard(d)
                        except json.JSONDecodeError:
                            pass
                            
        except Exception as e:
            print(f"[IPC Poller Error] {e}")
            
        await asyncio.sleep(0.5)

class CTFUpdateConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        global background_task
        active_ctf_consumers.add(self)
        if background_task is None:
            background_task = asyncio.create_task(poll_ipc_events())
        await self.accept()

    async def disconnect(self, close_code):
        active_ctf_consumers.discard(self)

    async def receive(self, text_data=None, bytes_data=None):
        pass # Not expecting client-to-server messages

