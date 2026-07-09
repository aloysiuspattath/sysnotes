import asyncio
import ssl
import sys
import logging
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] Proxy: %(message)s')
logger = logging.getLogger(__name__)

async def handle_client(reader, writer):
    # Connect to local waitress on port 5006
    try:
        w_reader, w_writer = await asyncio.open_connection('127.0.0.1', 5006)
    except Exception as e:
        logger.error(f"Failed to connect to local server: {e}")
        writer.close()
        return

    async def pipe(r, w, direction):
        try:
            while True:
                data = await r.read(8192)
                if not data:
                    break
                w.write(data)
                await w.drain()
        except Exception:
            pass
        finally:
            w.close()
            
    asyncio.create_task(pipe(reader, w_writer, "client->server"))
    asyncio.create_task(pipe(w_reader, writer, "server->client"))

async def main():
    listen_port = 5005
    target_port = 5006
    
    cert_path = os.path.join(os.path.dirname(__file__), 'cert.pem')
    key_path = os.path.join(os.path.dirname(__file__), 'key.pem')
    
    if not os.path.exists(cert_path) or not os.path.exists(key_path):
        logger.error("SSL Certificates not found! Please ensure cert.pem and key.pem exist.")
        sys.exit(1)

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(certfile=cert_path, keyfile=key_path)
    
    server = await asyncio.start_server(
        handle_client, '0.0.0.0', listen_port, ssl=ssl_context
    )
    
    addrs = ', '.join(str(sock.getsockname()) for sock in server.sockets)
    logger.info(f"Serving HTTPS on {addrs} -> forwarding to 127.0.0.1:{target_port}")
    
    async with server:
        await server.serve_forever()

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Proxy stopped.")
