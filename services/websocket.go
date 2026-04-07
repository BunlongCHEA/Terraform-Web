package services

import (
	"net/http"

	"github.com/gorilla/websocket"
)

var Upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// StreamLogsToWS streams job log lines live to the browser via WebSocket
func StreamLogsToWS(w http.ResponseWriter, r *http.Request, logChan <-chan JobResult) {
	conn, err := Upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	defer conn.Close()

	for result := range logChan {
		if result.Done {
			conn.WriteMessage(websocket.TextMessage, []byte("[DONE]"))
			break
		}
		if result.Error != nil {
			conn.WriteMessage(websocket.TextMessage, []byte("[ERROR] "+result.Error.Error()))
			break
		}
		conn.WriteMessage(websocket.TextMessage, []byte(result.LogLine))
	}
}
