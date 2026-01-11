package ipc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"sync"

	"khanzuo/internal/util"
)

type Transport struct {
	encMu   sync.Mutex
	encoder *json.Encoder
	decoder *json.Decoder

	incoming chan Message

	pendingMu sync.Mutex
	pending   map[string]chan Message

	closeOnce sync.Once
	closeErr  error
}

func NewTransport(r io.Reader, w io.Writer) *Transport {
	t := &Transport{
		encoder:  json.NewEncoder(w),
		decoder:  json.NewDecoder(r),
		incoming: make(chan Message),
		pending:  make(map[string]chan Message),
	}

	go t.readLoop()
	return t
}

func (t *Transport) readLoop() {
	for {
		var msg Message
		if err := t.decoder.Decode(&msg); err != nil {
			if err == io.EOF {
				t.closeWithError(err)
				return
			}
			t.closeWithError(err)
			return
		}

		if msg.ID != "" && (msg.Kind == KindResponse || msg.Kind == KindBrowserResult) {
			t.pendingMu.Lock()
			ch, ok := t.pending[msg.ID]
			if ok {
				delete(t.pending, msg.ID)
			}
			t.pendingMu.Unlock()
			if ok {
				ch <- msg
				close(ch)
			}
			continue
		}

		select {
		case t.incoming <- msg:
		default:
			// drop if no listener
		}
	}
}

func (t *Transport) closeWithError(err error) {
	t.closeOnce.Do(func() {
		t.closeErr = err
		close(t.incoming)
	})
}

func (t *Transport) Next(ctx context.Context) (Message, error) {
	select {
	case msg, ok := <-t.incoming:
		if !ok {
			if t.closeErr != nil {
				return Message{}, t.closeErr
			}
			return Message{}, io.EOF
		}
		return msg, nil
	case <-ctx.Done():
		return Message{}, ctx.Err()
	}
}

func (t *Transport) Send(msg Message) error {
	t.encMu.Lock()
	defer t.encMu.Unlock()
	return t.encoder.Encode(msg)
}

func (t *Transport) Respond(id string, payload any, err error) error {
	resp := Message{Kind: KindResponse, ID: id}
	if err != nil {
		resp.Error = &ErrorPayload{Message: err.Error()}
	} else if payload != nil {
		resp = resp.WithPayload(payload)
	}
	return t.Send(resp)
}

func (t *Transport) Emit(event string, payload any) error {
	msg := Message{Kind: KindEvent, Event: event}
	if payload != nil {
		msg = msg.WithPayload(payload)
	}
	return t.Send(msg)
}

func (t *Transport) Call(ctx context.Context, kind, command string, payload any) (Message, error) {
	id := util.NewID()
	waiter := make(chan Message, 1)
	t.pendingMu.Lock()
	t.pending[id] = waiter
	t.pendingMu.Unlock()

	msg := Message{Kind: kind, Command: command, ID: id}
	if payload != nil {
		msg = msg.WithPayload(payload)
	}

	if err := t.Send(msg); err != nil {
		t.pendingMu.Lock()
		delete(t.pending, id)
		t.pendingMu.Unlock()
		return Message{}, err
	}

	select {
	case resp := <-waiter:
		if resp.Error != nil {
			return Message{}, fmt.Errorf(resp.Error.Message)
		}
		return resp, nil
	case <-ctx.Done():
		return Message{}, ctx.Err()
	}
}
