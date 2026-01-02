package app

import (
	"context"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Start Session begins a new investigation session instance and restusn the session ID
func (a *App) StartSession(url string) {

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
