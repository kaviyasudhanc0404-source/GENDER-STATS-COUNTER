# Backend image for Hugging Face Spaces (Docker SDK). Serves the API on port 7860.
FROM python:3.13-slim

# Hugging Face runs the container as user 1000
RUN useradd --create-home --uid 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    API_PORT=7860
WORKDIR /home/user/app

COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user app ./app
COPY --chown=user models ./models

EXPOSE 7860
CMD ["python", "-m", "app.main"]
