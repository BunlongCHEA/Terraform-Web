package services

import (
	"log"
	"sync"
)

// JobQueue manages concurrent job execution with a worker pool
type JobQueue struct {
	maxWorkers int
	queue      chan func()
	wg         sync.WaitGroup
}

// NewJobQueue creates a queue with a maximum number of concurrent workers.
// Use maxWorkers=1 to prevent concurrent terraform runs (recommended).
func NewJobQueue(maxWorkers int) *JobQueue {
	q := &JobQueue{
		maxWorkers: maxWorkers,
		queue:      make(chan func(), 50), // buffer up to 50 queued jobs
	}
	q.start()
	return q
}

// start spawns the worker goroutines
func (q *JobQueue) start() {
	for i := 0; i < q.maxWorkers; i++ {
		workerID := i + 1
		q.wg.Add(1)
		go func(id int) {
			defer q.wg.Done()
			log.Printf("[JobQueue] Worker %d started", id)
			for fn := range q.queue {
				log.Printf("[JobQueue] Worker %d picked up a job", id)
				fn()
				log.Printf("[JobQueue] Worker %d finished job", id)
			}
			log.Printf("[JobQueue] Worker %d stopped", id)
		}(workerID)
	}
}

// Enqueue adds a job function to the queue.
// Returns false if the queue is full (backpressure).
func (q *JobQueue) Enqueue(job func()) bool {
	select {
	case q.queue <- job:
		return true
	default:
		log.Println("[JobQueue] Queue is full, job rejected")
		return false
	}
}

// Shutdown gracefully stops the queue after all current jobs finish
func (q *JobQueue) Shutdown() {
	close(q.queue)
	q.wg.Wait()
	log.Println("[JobQueue] All workers shut down")
}

// Global queue — 2 concurrent terraform runs max
var GlobalQueue = NewJobQueue(2)
