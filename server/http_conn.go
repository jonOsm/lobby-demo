package main

import (
	"encoding/json"
	"net/http"
)

// HTTPConn adapts an http.ResponseWriter to the Conn interface.
type HTTPConn struct {
	w http.ResponseWriter
}

func (hc *HTTPConn) WriteJSON(v interface{}) error {
	hc.w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(hc.w).Encode(v)
}
