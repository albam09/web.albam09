from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser
os.chdir(Path(__file__).resolve().parent)
for port in range(8765,8780):
    try:
        server=ThreadingHTTPServer(('127.0.0.1',port),SimpleHTTPRequestHandler)
        break
    except OSError: pass
else: raise RuntimeError('사용 가능한 로컬 포트가 없습니다.')
url='http://127.0.0.1:%s/' % server.server_port
print('albam09 로컬 확인:',url,flush=True)
webbrowser.open(url)
server.serve_forever()
