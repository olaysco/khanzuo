package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"khanzuo/internal/browser"
)

type Session struct {
	ID   string
	URL  string
	emit Emitters

	b *browser.Controller
}

func NewSession(sessionID string, url string, emit Emitters) *Session {
	return &Session{
		ID:   sessionID,
		URL:  url,
		emit: emit,
		b:    browser.NewController(),
	}
}

func (s *Session) Start(ctx context.Context) error {
	s.emit.Log("info", "Launching browser (Rod)")
	if err := s.b.Start(ctx); err != nil {
		return fmt.Errorf("browser start: %w", err)
	}

	s.emit.Log("info", fmt.Sprintf("Navigating to %s", s.URL))
	if err := s.b.Goto(s.URL); err != nil {
		_ = s.b.Stop()
		return fmt.Errorf("goto: %w", err)
	}

	// Capture initial frame
	s.emit.Log("info", "Capturing initial frame")
	frame, err := s.b.CaptureFrame()
	if err != nil {
		_ = s.b.Stop()
		return fmt.Errorf("capture frame: %w", err)
	}

	s.emit.Frame(frame)
	return nil
}

func (s *Session) Stop() error {
	s.emit.Log("info", "Stopping session")
	return s.b.Stop()
}

func newID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
