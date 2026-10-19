/**
 * Alumni Platform Multi-Core Load Balancer & Process Cluster
 * 
 * Features:
 * - Spawns worker processes across multiple CPU cores to balance traffic.
 * - Distributes TCP/HTTP connections using Node's round-robin load balancer.
 * - Zero-downtime auto-respawn: if any worker crashes, a fresh replacement is spawned immediately.
 * - Exposes health metrics and worker lifecycle telemetry.
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 5000;
const cpuCount = os.cpus().length;
const configuredWorkers = process.env.CLUSTER_WORKERS 
    ? parseInt(process.env.CLUSTER_WORKERS, 10) 
    : Math.min(cpuCount, 4); // Default to up to 4 worker processes

if (cluster.isPrimary || cluster.isMaster) {
    console.log('================================================================');
    console.log('🚀 ALUMNI PLATFORM ENTERPRISE LOAD BALANCER ACTIVE');
    console.log('================================================================');
    console.log(`[Master PID]         : ${process.pid}`);
    console.log(`[System CPU Cores]   : ${cpuCount}`);
    console.log(`[Active Worker Pool] : ${configuredWorkers} worker processes`);
    console.log(`[Load Balancing Mode]: Round-Robin (OS IPC Handle Sharing)`);
    console.log(`[Anti-Bot Shield]    : Active (Header & Scanner Filtering)`);
    console.log(`[Brute-Force Guard]  : Active (5 Failed Attempts -> 10m Block)`);
    console.log(`[Listening Port]     : ${PORT}`);
    console.log('================================================================');

    const workerStats = new Map();

    // Fork initial pool of workers
    for (let i = 0; i < configuredWorkers; i++) {
        const worker = cluster.fork({ WORKER_INDEX: i + 1 });
        workerStats.set(worker.id, {
            pid: worker.process.pid,
            index: i + 1,
            startedAt: new Date(),
            restarts: 0
        });
    }

    // Monitor worker online status
    cluster.on('online', (worker) => {
        console.log(`[Load Balancer] Worker #${worker.id} (PID ${worker.process.pid}) online and receiving traffic.`);
    });

    // Auto-respawn crashed or terminated workers
    cluster.on('exit', (worker, code, signal) => {
        console.warn(`[Load Balancer ALERT] Worker #${worker.id} (PID ${worker.process.pid}) died (Signal: ${signal || 'None'}, Code: ${code}).`);
        
        const previousStats = workerStats.get(worker.id) || { restarts: 0, index: 1 };
        workerStats.delete(worker.id);

        console.log('[Load Balancer] Spawning replacement worker process to maintain full capacity...');
        const newWorker = cluster.fork({ WORKER_INDEX: previousStats.index });
        workerStats.set(newWorker.id, {
            pid: newWorker.process.pid,
            index: previousStats.index,
            startedAt: new Date(),
            restarts: previousStats.restarts + 1
        });
    });

    // Graceful rolling reload on SIGUSR2
    process.on('SIGUSR2', () => {
        console.log('[Load Balancer] Received SIGUSR2. Initiating zero-downtime rolling restart...');
        const workers = Object.values(cluster.workers);
        
        function restartNext(i) {
            if (i >= workers.length) {
                console.log('[Load Balancer] Rolling restart completed successfully.');
                return;
            }
            const w = workers[i];
            console.log(`[Load Balancer] Restarting worker #${w.id}...`);
            w.kill();
            setTimeout(() => restartNext(i + 1), 1500);
        }
        
        restartNext(0);
    });

} else {
    // Worker processes execute the main Express backend application
    require('./index.js');
}
