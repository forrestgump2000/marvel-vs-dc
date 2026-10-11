# Local dev server that disables caching so module edits show up on reload.
import http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def do_POST(self):
        # dev-only: tools/art.html posts rendered PNGs here to save them into assets/
        from urllib.parse import urlparse, parse_qs
        import os, re
        q = parse_qs(urlparse(self.path).query)
        name = q.get('name', [''])[0]
        if not re.fullmatch(r'[a-z0-9-]+\.png', name):
            self.send_response(400); self.end_headers(); return
        data = self.rfile.read(int(self.headers['Content-Length']))
        with open(os.path.join('assets', name), 'wb') as f: f.write(data)
        self.send_response(200); self.end_headers(); self.wfile.write(b'saved')

http.server.ThreadingHTTPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 5173), H).serve_forever()
