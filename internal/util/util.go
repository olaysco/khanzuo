package util

import (
	"crypto/rand"
	"encoding/hex"
)

func NewID() string {
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}
