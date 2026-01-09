package browser

import (
	"context"
	"time"

	"khanzuo/internal/ipc"
)

type Controller struct {
	sessionID string
	transport *ipc.Transport
}

func NewController(sessionID string, transport *ipc.Transport) *Controller {
	return &Controller{sessionID: sessionID, transport: transport}
}

func (c *Controller) Start(ctx context.Context) error {
	_, err := c.transport.Call(ctx, ipc.KindBrowserCommand, "ensureSession", map[string]string{
		"sessionId": c.sessionID,
	})
	return err
}

func (c *Controller) Goto(ctx context.Context, url string) error {
	_, err := c.transport.Call(ctx, ipc.KindBrowserCommand, "goto", map[string]string{
		"sessionId": c.sessionID,
		"url":       url,
	})
	return err
}

func (c *Controller) Stop() error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	_, err := c.transport.Call(ctx, ipc.KindBrowserCommand, "stop", map[string]string{
		"sessionId": c.sessionID,
	})
	return err
}
