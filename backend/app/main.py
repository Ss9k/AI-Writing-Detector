"""
FastAPI application for AI Writing Detector.
Also provides a fallback standard-library HTTP server when FastAPI is not installed.
"""
import json
from .analyzer import analyze_text

try:
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    class TextRequest(BaseModel):
        text: str

    app = FastAPI(
        title="AI Writing Detector API",
        description="Deterministic rule-based linguistic and statistical analysis engine for AI writing patterns.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "AI Writing Detector (Python Engine)"}

    @app.post("/api/analyze")
    def analyze(payload: TextRequest):
        if not payload.text or not payload.text.strip():
            raise HTTPException(status_code=400, detail="Input text cannot be empty.")
        try:
            report = analyze_text(payload.text)
            return report.to_dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

except ImportError:
    app = None

# If run directly as a script:
if __name__ == "__main__":
    if app is not None:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    else:
        from http.server import HTTPServer, BaseHTTPRequestHandler

        class SimpleHandler(BaseHTTPRequestHandler):
            def do_GET(self):
                if self.path == "/api/health":
                    self.send_response(200)
                    self.send_header("Content-type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"status": "ok", "engine": "standard_library"}).encode("utf-8"))
                else:
                    self.send_response(404)
                    self.end_headers()

            def do_POST(self):
                if self.path == "/api/analyze":
                    content_length = int(self.headers.get("Content-Length", 0))
                    body = self.rfile.read(content_length).decode("utf-8")
                    try:
                        data = json.loads(body)
                        text = data.get("text", "")
                        if not text.strip():
                            self.send_response(400)
                            self.send_header("Content-type", "application/json")
                            self.end_headers()
                            self.wfile.write(json.dumps({"error": "Empty text"}).encode("utf-8"))
                            return
                        report = analyze_text(text)
                        self.send_response(200)
                        self.send_header("Content-type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps(report.to_dict()).encode("utf-8"))
                    except Exception as err:
                        self.send_response(500)
                        self.send_header("Content-type", "application/json")
                        self.end_headers()
                        self.wfile.write(json.dumps({"error": str(err)}).encode("utf-8"))
                else:
                    self.send_response(404)
                    self.end_headers()

        server = HTTPServer(("0.0.0.0", 8000), SimpleHandler)
        print("Starting fallback Python server on port 8000...")
        server.serve_forever()
