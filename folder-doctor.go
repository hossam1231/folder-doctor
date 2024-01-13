package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
)

func watchFolder(srcPath, destPath string) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		fmt.Println("Error creating watcher:", err)
		return
	}
	defer watcher.Close()

	// Initial copy of the entire folder
	err = copyFolder(srcPath, destPath)
	if err != nil {
		fmt.Println("Error copying folder:", err)
		return
	}

	err = filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		return watcher.Add(path)
	})

	if err != nil {
		fmt.Println("Error adding folder to watcher:", err)
		return
	}

	fmt.Println("Watching for changes in", srcPath)

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}

			if event.Op&fsnotify.Write == fsnotify.Write || event.Op&fsnotify.Create == fsnotify.Create {
				fmt.Println("Detected change:", event.Name)

				err := copyFolder(srcPath, destPath)
				if err != nil {
					fmt.Println("Error copying file or folder:", err)
				}
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			fmt.Println("Error watching folder:", err)
		}
	}
}

func copyFolder(srcPath, destPath string) error {
	err := filepath.Walk(srcPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(srcPath, path)
		if err != nil {
			return err
		}

		destFilePath := filepath.Join(destPath, relPath)
		if info.IsDir() {
			return os.MkdirAll(destFilePath, info.Mode())
		}

		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		destFile, err := os.Create(destFilePath)
		if err != nil {
			return err
		}
		defer destFile.Close()

		_, err = io.Copy(destFile, file)
		return err
	})

	return err
}

func main() {
	srcPath := "./node_modules/@medusajs/admin-ui"
	destPath := "./admin-ui"

	go watchFolder(srcPath, destPath)

	// Keep the application running
	select {}
}
