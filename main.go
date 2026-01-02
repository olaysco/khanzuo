package main

import (
	"embed"
	"khanzuo/internal/app"
	"runtime"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	const MIN_WINDOW_WIDTH = 1024
	const MIN_WINDOW_HEIGHT = 768
	windowWidth, windowHeight, maximised := MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT, true
	windowStartState := options.Normal
	if maximised {
		windowStartState = options.Maximised
	}
	isMacOS := runtime.GOOS == "darwin"
	appMenu := menu.NewMenu()
	if isMacOS {
		appMenu.Append(menu.AppMenu())
		appMenu.Append(menu.EditMenu())
		appMenu.Append(menu.WindowMenu())
	}

	// Create an instance of the app structure
	appInstance := app.NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "khanzuo",
		Width:            windowWidth,
		Height:           windowHeight,
		WindowStartState: windowStartState,
		MinWidth:         MIN_WINDOW_WIDTH,
		MinHeight:        MIN_WINDOW_HEIGHT,
		Menu:             appMenu,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        appInstance.Startup,
		Bind: []interface{}{
			appInstance,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
