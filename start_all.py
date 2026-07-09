import subprocess
import time
import sys

def main():
    print("Starting SSL Proxy...", flush=True)
    proxy_proc = subprocess.Popen([sys.executable, "ssl_proxy.py"])
    
    print("Starting Waitress Server...", flush=True)
    server_proc = subprocess.Popen([sys.executable, "run_prod.py"])
    
    try:
        # Wait for the server to exit (it shouldn't normally)
        server_proc.wait()
    except KeyboardInterrupt:
        print("Shutting down...", flush=True)
    finally:
        # If the server exits or user presses Ctrl+C, kill both
        if server_proc.poll() is None:
            server_proc.terminate()
            server_proc.wait()
            
        print("Stopping SSL Proxy...", flush=True)
        if proxy_proc.poll() is None:
            proxy_proc.terminate()
            proxy_proc.wait()

if __name__ == "__main__":
    main()
