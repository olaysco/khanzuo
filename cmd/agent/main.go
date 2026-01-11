package main

import (
	"context"
	"log"
	"os"

	"khanzuo/internal/app"
	"khanzuo/internal/ipc"
)

func main() {
	ctx := context.Background()
	transport := ipc.NewTransport(os.Stdin, os.Stdout)
	application := app.NewApp(transport)

	for {
		msg, err := transport.Next(ctx)
		if err != nil {
			log.Printf("ipc closed: %v", err)
			return
		}

		if msg.Kind != ipc.KindRequest {
			log.Printf("ignored message kind %s", msg.Kind)
			continue
		}

		go handleRequest(ctx, transport, application, msg)
	}
}

func handleRequest(ctx context.Context, transport *ipc.Transport, application *app.App, msg ipc.Message) {
	var resp any
	var err error

	switch msg.Command {
	case "create-session-id":
		resp, err = application.HandleCreateSessionID()
	case "start-session":
		resp, err = application.HandleStartSession(ctx, msg)
	case "stop-session":
		resp, err = application.HandleStopSession(msg)
	case "send-prompt":
		resp, err = application.HandleSendPrompt(msg)
	case "export-bundle":
		resp, err = application.HandleExportBundle(msg)
	default:
		err = app.ErrUnknownCommand(msg.Command)
	}

	if rerr := transport.Respond(msg.ID, resp, err); rerr != nil {
		log.Printf("failed to send response: %v", rerr)
	}
}
