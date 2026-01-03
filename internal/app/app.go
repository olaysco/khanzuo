package app

import (
	"context"
	"fmt"
	"khanzuo/internal/session"
	"khanzuo/internal/util"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
	sm  *session.Manager
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		sm: session.NewManager(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Start Session begins a new investigation session instance and restusn the session ID
func (a *App) StartSession(sessionID string, url string) (string, error) {
	if a.ctx == nil {
		return "", fmt.Errorf("app not initialized: Startup() not called yet")
	}
	if url == "" {
		return "", fmt.Errorf("url is required")
	}

	// UI feedback early
	runtime.EventsEmit(a.ctx, "session:status", "Starting")
	runtime.EventsEmit(a.ctx, "agent:log", fmt.Sprintf("Starting session for %s", url))

	// Create / replace the current session
	sess, err := a.sm.Start(a.ctx, sessionID, url, a.emitters(sessionID))
	if err != nil {
		runtime.EventsEmit(a.ctx, "session:status", "Error")
		runtime.EventsEmit(a.ctx, "agent:log", fmt.Sprintf("Failed to start session: %v", err))
		return "", err
	}

	runtime.EventsEmit(a.ctx, "session:status", "Ready")
	runtime.EventsEmit(a.ctx, "agent:log", "Session ready")

	return sess.ID, nil
}

// Send Prompt passes the prompt to interact with the current session
func (a *App) SendPrompt() {
	panic("not yet implemented")
}

// Stop Session terminates the current session and ongion agent tasks
func (a *App) StopSession() {
	panic("not yet implemented")
}

// Export bundle returns debugging session asa formatted JSON
func (a *App) ExportBundle() {
	panic("not yet implemented")
}

// CreateSessionID generates a new session ID for the frontend to use.
func (a *App) CreateSessionID() string {
	for {
		id := util.NewID()
		if a.sm == nil || !a.sm.Exists(id) {
			return id
		}
	}
}

// emit is an adapter passed down to session layer to publish UI events.
func (a *App) emit(event string, payload any) {
	runtime.EventsEmit(a.ctx, event, payload)
}
