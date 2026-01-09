package app

import (
	"khanzuo/internal/session"
	"time"
)

// SessionID allows us to have multiple event across sessions
// The other option it to prefix event with sessionid, event:name:session_id
// But can be messy to manage
type StatusEvent struct {
	SessionID string `json:"sessionId"`
	Status    string `json:"status"` // Idle|Starting|Ready|Acting|FailureDetected|Error
	TS        int64  `json:"ts"`
}

type LogEvent struct {
	SessionID string `json:"sessionId"`
	Level     string `json:"level"` // info|warn|error
	Message   string `json:"message"`
	TS        int64  `json:"ts"`
}

func nowMillis() int64 { return time.Now().UnixMilli() }

func (a *App) emitStatus(sessionID, status string) {
	_ = a.transport.Emit("session:status", StatusEvent{
		SessionID: sessionID,
		Status:    status,
		TS:        nowMillis(),
	})
}

func (a *App) emitLog(sessionID, level, msg string) {
	_ = a.transport.Emit("agent:log", LogEvent{
		SessionID: sessionID,
		Level:     level,
		Message:   msg,
		TS:        nowMillis(),
	})
}

func (a *App) emitters(sessionID string) session.Emitters {
	return session.Emitters{
		Status: func(status string) { a.emitStatus(sessionID, status) },
		Log:    func(level, msg string) { a.emitLog(sessionID, level, msg) },
	}
}
