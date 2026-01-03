package browser

import (
	"context"
	"encoding/base64"
	"fmt"
	"time"

	"github.com/go-rod/rod"
	"github.com/go-rod/rod/lib/launcher"
	"github.com/go-rod/rod/lib/proto"
)

type Controller struct {
	browser *rod.Browser
	page    *rod.Page
}

func NewController() *Controller {
	return &Controller{}
}

// Start launches a new browser instance
func (c *Controller) Start(ctx context.Context) error {
	// Launch headless Chrome
	u, err := launcher.New().
		Headless(true).
		Launch()
	if err != nil {
		return err
	}

	c.browser = rod.New().ControlURL(u)
	if err := c.browser.Connect(); err != nil {
		return err
	}

	// Create a blank page up-front
	c.page = c.browser.MustPage()

	_ = c.page.SetViewport(&proto.EmulationSetDeviceMetricsOverride{
		Width:             1280,
		Height:            720,
		DeviceScaleFactor: 1,
		Mobile:            false,
	})
	return nil
}

// Stop closes the current browser instance
func (c *Controller) Stop() error {
	if c.page != nil {
		_ = c.page.Close()
		c.page = nil
	}
	if c.browser != nil {
		_ = c.browser.Close()
		c.browser = nil
	}
	return nil
}

// Goto navigates to a URL
func (c *Controller) Goto(url string) error {
	if c.page == nil {
		return fmt.Errorf("page not initialized")
	}

	if err := c.page.Navigate(url); err != nil {
		return err
	}

	// Wait for DOMContentLoaded / Load event
	c.page.WaitLoad()

	// Optional: small settle time for SPA hydration
	c.page.WaitIdle(1 * time.Second)

	// For SPAs: network quiet + render complete
	_ = c.WaitForRenderComplete(2 * time.Second)
	fmt.Println("here")

	return nil
}

// CaptureFrame returns a screenshot of the current page
func (c *Controller) CaptureFrame() (string, error) {
	if c.page == nil {
		return "", fmt.Errorf("page not initialized")
	}

	quality := 85
	jpg, err := c.page.Screenshot(true, &proto.PageCaptureScreenshot{
		Format:  proto.PageCaptureScreenshotFormatJpeg,
		Quality: &quality,
	})
	if err != nil {
		return "", err
	}

	enc := base64.StdEncoding.EncodeToString(jpg)
	return "data:image/jpeg;base64," + enc, nil
}

func (c *Controller) WaitForRenderComplete(timeout time.Duration) error {
	if c.page == nil {
		return fmt.Errorf("page not initialized")
	}

	deadline := time.Now().Add(timeout)

	// 1) Wait for document.readyState === "complete"
	for time.Now().Before(deadline) {
		ready, err := c.page.Eval(`() => document.readyState === "complete"`)
		if err == nil && ready.Value.Bool() {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}

	// 2) Wait for fonts (if supported)
	// Some pages depend on fonts for layout; missing fonts can cause "partial-looking" screenshots.
	_, _ = c.page.Eval(`() => (document.fonts && document.fonts.ready) ? document.fonts.ready : true`)

	// 3) Wait for images to finish loading (or error out)
	for time.Now().Before(deadline) {
		ok, err := c.page.Eval(`() => {
			const imgs = Array.from(document.images || []);
			return imgs.every(img => img.complete);
		}`)
		if err == nil && ok.Value.Bool() {
			return nil
		}
		time.Sleep(150 * time.Millisecond)
	}

	return fmt.Errorf("timeout waiting for render complete")
}
