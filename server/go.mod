module github.com/jonosm/lobby-demo-backend

go 1.24.5

replace github.com/jonosm/multiplayer-lobby => ../../multiplayer-lobby

require (
	github.com/gorilla/websocket v1.5.3
	github.com/jonosm/multiplayer-lobby v0.0.0-00010101000000-000000000000
)
