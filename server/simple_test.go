package main

import (
	"fmt"
	"log"
	"net/http"
)

func startSimpleServer() {
	fmt.Println("Starting simple test server...")

	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Simple test server is working!")
	})

	fmt.Println("Simple test server listening on :8081")
	log.Fatal(http.ListenAndServe(":8081", nil))
}
