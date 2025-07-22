package main

import (
	"github.com/gorilla/websocket"
)

// WebSocketConn adapts a Gorilla WebSocket connection to the Conn interface.
type WebSocketConn struct {
	conn *websocket.Conn
}

func (wsc *WebSocketConn) WriteJSON(v interface{}) error {
	return wsc.conn.WriteJSON(v)
}
