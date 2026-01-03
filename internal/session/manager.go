package session

import (
	"context"
	"errors"
	"sync"
)

var ErrSessionNotFound = errors.New("session not found")

type Manager struct {
	mu       sync.RWMutex
	sessions map[string]*Session
}

func NewManager() *Manager {
	return &Manager{
		sessions: make(map[string]*Session),
	}
}

// Start creates a new session, and starts it.
func (m *Manager) Start(ctx context.Context, url string, emit func(string, any)) (*Session, error) {
	s := NewSession(url, emit)

	if err := s.Start(ctx); err != nil {
		return nil, err
	}

	m.mu.Lock()
	m.sessions[s.ID] = s
	m.mu.Unlock()

	return s, nil
}

// Get returns a session by ID.
func (m *Manager) Get(id string) (*Session, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	session, ok := m.sessions[id]
	return session, ok
}

// ListIDs returns active session IDs (useful for UI).
func (m *Manager) ListIDs() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	out := make([]string, 0, len(m.sessions))
	for id := range m.sessions {
		out = append(out, id)
	}
	return out
}

// Stop stops a specific session and removes it.
func (m *Manager) Stop(id string) error {
	m.mu.Lock()
	s, ok := m.sessions[id]
	if ok {
		delete(m.sessions, id)
	}
	m.mu.Unlock()

	if !ok {
		return ErrSessionNotFound
	}
	return s.Stop()
}
