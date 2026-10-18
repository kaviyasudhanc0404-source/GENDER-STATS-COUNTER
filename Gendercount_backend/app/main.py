"""
FastAPI application for the Gender Statistics Counter.
"""
import asyncio
import contextlib
import logging
import os
import shutil
import tempfile
import threading
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from app import config
from app.pipeline import GenderPipeline
from app.schemas import Health, ImageDetection, VideoDetection

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.pipeline = await run_in_threadpool(GenderPipeline)
    yield


app = FastAPI(
    title="Gender Statistics Counter API",
    description="Gender distribution analysis from images, videos and live camera frames",
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def validate_upload(file: UploadFile, allowed_extensions: set[str], max_mb: int) -> str:
    """Reject unsupported or oversized uploads; return the file extension."""
    extension = Path(file.filename or "").suffix.lower()
    if extension not in allowed_extensions:
        raise HTTPException(415, f"Unsupported file type. Allowed: {', '.join(sorted(allowed_extensions))}")
    if file.size is not None and file.size > max_mb * 1024 * 1024:
        raise HTTPException(413, f"File is larger than {max_mb} MB")
    return extension


@app.get("/health", response_model=Health)
def health():
    return Health(status="ok")


@app.post("/detect/image", response_model=ImageDetection)
def detect_image(request: Request, file: UploadFile = File(...)):
    """Detect faces and classify their gender in an image or a live camera frame."""
    validate_upload(file, config.ALLOWED_IMAGE_EXTENSIONS, config.MAX_IMAGE_MB)
    try:
        return request.app.state.pipeline.analyze_image(file.file.read())
    except ValueError as error:
        raise HTTPException(400, str(error)) from error


@app.post("/detect/video", response_model=VideoDetection)
async def detect_video(request: Request, file: UploadFile = File(...)):
    """Count unique people in a video. Processing stops early when the client disconnects."""
    extension = validate_upload(file, config.ALLOWED_VIDEO_EXTENSIONS, config.MAX_VIDEO_MB)
    descriptor, path = tempfile.mkstemp(suffix=extension)
    try:
        with os.fdopen(descriptor, "wb") as target:
            await run_in_threadpool(shutil.copyfileobj, file.file, target)

        cancel = threading.Event()
        analysis = asyncio.ensure_future(run_in_threadpool(request.app.state.pipeline.analyze_video, path, cancel))
        while not analysis.done():
            if await request.is_disconnected():
                cancel.set()
            await asyncio.wait({analysis}, timeout=0.5)
        return analysis.result()
    except ValueError as error:
        raise HTTPException(400, str(error)) from error
    finally:
        os.remove(path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=config.API_HOST, port=config.API_PORT, reload=config.API_RELOAD)
