package ipc

import "encoding/json"

const (
	KindRequest        = "request"
	KindResponse       = "response"
	KindEvent          = "event"
	KindBrowserCommand = "browserCommand"
	KindBrowserResult  = "browserResult"
)

type Message struct {
	Kind    string          `json:"kind"`
	ID      string          `json:"id,omitempty"`
	Command string          `json:"command,omitempty"`
	Event   string          `json:"event,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
	Error   *ErrorPayload   `json:"error,omitempty"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

func (m Message) WithPayload(data any) Message {
	if data == nil {
		return m
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return m
	}
	m.Payload = raw
	return m
}

func (m Message) DecodePayload(v any) error {
	if len(m.Payload) == 0 {
		return nil
	}
	return json.Unmarshal(m.Payload, v)
}
