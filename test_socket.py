import socketio

sio = socketio.Client()

@sio.on('connect', namespace='/location')
def on_connect():
    print('connected to location namespace')
    sio.emit('join_admin_fleet', namespace='/location')

@sio.on('position_update', namespace='/location')
def on_message(data):
    print('position update:', data)

sio.connect('http://localhost:8000', namespaces=['/location'])
sio.wait()
