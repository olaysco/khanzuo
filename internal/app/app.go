package app

import (
	"context"
	"fmt"
	"khanzuo/internal/browser"
	"khanzuo/internal/ipc"
	"khanzuo/internal/session"
	"khanzuo/internal/util"
)

func ErrUnknownCommand(cmd string) error {
	return fmt.Errorf("unknown command: %s", cmd)
}

type App struct {
	sm        *session.Manager
	transport *ipc.Transport
}

func NewApp(tr *ipc.Transport) *App {
	return &App{
		sm:        session.NewManager(),
		transport: tr,
	}
}

type CreateSessionResponse struct {
	SessionID string `json:"sessionId"`
}

type StartSessionRequest struct {
	SessionID string `json:"sessionId"`
	URL       string `json:"url"`
}

type StartSessionResponse struct {
	SessionID string `json:"sessionId"`
}

type StopSessionRequest struct {
	SessionID string `json:"sessionId"`
}

type GenericAck struct {
	Status string `json:"status"`
}

func (a *App) HandleCreateSessionID() (any, error) {
	return CreateSessionResponse{SessionID: a.CreateSessionID()}, nil
}

func (a *App) HandleStartSession(ctx context.Context, msg ipc.Message) (any, error) {
	var payload StartSessionRequest
	if err := msg.DecodePayload(&payload); err != nil {
		return nil, err
	}
	if payload.SessionID == "" {
		payload.SessionID = a.CreateSessionID()
	}
	if payload.URL == "" {
		return nil, fmt.Errorf("url is required")
	}

	a.emitStatus(payload.SessionID, "Starting")
	a.emitLog(payload.SessionID, "info", fmt.Sprintf("Starting session for %s", payload.URL))

	controller := browser.NewController(payload.SessionID, a.transport)
	_, err := a.sm.Start(ctx, payload.SessionID, payload.URL, a.emitters(payload.SessionID), controller)
	if err != nil {
		a.emitStatus(payload.SessionID, "Error")
		a.emitLog(payload.SessionID, "error", fmt.Sprintf("Failed to start session: %v", err))
		return nil, err
	}

	a.emitStatus(payload.SessionID, "Ready")
	a.emitLog(payload.SessionID, "info", "Session ready")

	return StartSessionResponse{SessionID: payload.SessionID}, nil
}

func (a *App) HandleStopSession(msg ipc.Message) (any, error) {
	var payload StopSessionRequest
	if err := msg.DecodePayload(&payload); err != nil {
		return nil, err
	}
	if payload.SessionID == "" {
		return nil, fmt.Errorf("sessionId is required")
	}
	if err := a.sm.Stop(payload.SessionID); err != nil {
		return nil, err
	}
	a.emitStatus(payload.SessionID, "Idle")
	return GenericAck{Status: "ok"}, nil
}

func (a *App) HandleSendPrompt(msg ipc.Message) (any, error) {
	return nil, fmt.Errorf("send prompt not implemented")
}

func (a *App) HandleExportBundle(msg ipc.Message) (any, error) {
	return nil, fmt.Errorf("export bundle not implemented")
}

func (a *App) CreateSessionID() string {
	for {
		id := util.NewID()
		if a.sm == nil || !a.sm.Exists(id) {
			return id
		}
	}
}
