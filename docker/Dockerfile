FROM python:3.12-slim

WORKDIR /app

ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple/
ENV UV_DEFAULT_INDEX=$PIP_INDEX_URL
ENV UV_HTTP_TIMEOUT=180
ENV UV_HTTP_RETRIES=8

RUN pip install --no-cache-dir uv==0.9.2

ENV UV_PROJECT_ENVIRONMENT="/usr/local/"

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-install-project

COPY . .

CMD ["bash", "-c", "python main.py --check-secret-key; sanic app_factory:create_app --factory -H 0.0.0.0 -p 8000"]
