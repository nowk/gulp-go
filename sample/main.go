package main

import (
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		w.Write([]byte("Hello World!"))
	})

	l, err := net.Listen("tcp", ":3000")
	if err != nil {
		log.Fatalf("listen: %s", err)
	}

	ch := make(chan os.Signal)
	signal.Notify(ch, os.Interrupt, os.Kill)

	go func() {
		log.Println("starting server...")
		err := http.Serve(l, mux)
		if err != nil {
			log.Fatalf("serve: %s", err)
		}
	}()

	<-ch
	if err := l.Close(); err != nil {
		log.Printf("serve close: %s", err)
	}

	log.Println("server closed")
}
