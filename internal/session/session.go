package session

import (
	"context"
	"fmt"
	"khanzuo/internal/browser"
)

type Session struct {
	ID   string
	URL  string
	emit Emitters

	b *browser.Controller
}

func NewSession(sessionID string, url string, emit Emitters, ctrl *browser.Controller) *Session {
	return &Session{
		ID:   sessionID,
		URL:  url,
		emit: emit,
		b:    ctrl,
	}
}

func (s *Session) Start(ctx context.Context) error {
	s.emit.Log("info", "Preparing session view")
	if err := s.b.Start(ctx); err != nil {
		return fmt.Errorf("browser start: %w", err)
	}

	s.emit.Log("info", fmt.Sprintf("Navigating to %s", s.URL))
	if err := s.b.Goto(ctx, s.URL); err != nil {
		_ = s.b.Stop()
		return fmt.Errorf("goto: %w", err)
	}
	return nil
}

func (s *Session) Stop() error {
	s.emit.Log("info", "Stopping session")
	return s.b.Stop()
}
