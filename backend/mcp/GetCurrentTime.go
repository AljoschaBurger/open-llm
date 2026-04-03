package mcp

import (
	"time"
	_ "time/tzdata" // import for docker
)

// returns the time in the user timezone (the city string is useless, just to practice parameters for the llm)
func GetCurrentTime(city string) string {
	loc, err := time.LoadLocation("Europe/Berlin") // hardcoded because the docker container 'thinks' he has to use utc - TODO: Maybe build the location into a dynmaic config key
	if err != nil {
		loc = time.UTC
	}
	t := time.Now().In(loc)
	var resp = "The current time in " + city + " is " + t.Format("15:04:05")
	return resp
}
