package browser

import (
	"context"
	"encoding/base64"
	"fmt"

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

	return c.page.Navigate(url)
}

// CaptureFrame returns a screenshot of the current page
func (c *Controller) CaptureFrame() (string, error) {
	var quality int = 90
	if c.page == nil {
		return "", fmt.Errorf("page not initialized")
	}

	png, err := c.page.Screenshot(true, &proto.PageCaptureScreenshot{
		Quality: &quality,
	})
	if err != nil {
		return "", err
	}

	enc := base64.StdEncoding.EncodeToString(png)
	return "data:image/png;base64," + enc, nil
}
