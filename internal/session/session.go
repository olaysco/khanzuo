package session

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"khanzuo/internal/browser"
	"khanzuo/internal/util"
)

type Session struct {
	ID   string
	URL  string
	emit func(string, any)

	b *browser.Controller
}

func NewSession(url string, emit func(string, any)) *Session {
	return &Session{
		ID:   util.NewID(),
		URL:  url,
		emit: emit,
		b:    browser.NewController(),
	}
}

func (s *Session) Start(ctx context.Context) error {
	s.emit("agent:log", "Launching browser (Rod)")
	if err := s.b.Start(ctx); err != nil {
		return fmt.Errorf("browser start: %w", err)
	}

	s.emit("agent:log", fmt.Sprintf("Navigating to %s", s.URL))
	if err := s.b.Goto(s.URL); err != nil {
		_ = s.b.Stop()
		return fmt.Errorf("goto: %w", err)
	}

	// Capture initial frame
	s.emit("agent:log", "Capturing initial frame")
	frame, err := s.b.CaptureFrame()
	if err != nil {
		_ = s.b.Stop()
		return fmt.Errorf("capture frame: %w", err)
	}

	s.emit("frame:update", frame)
	return nil
}

func (s *Session) Stop() error {
	s.emit("agent:log", "Stopping session")
	return s.b.Stop()
}

func newID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
